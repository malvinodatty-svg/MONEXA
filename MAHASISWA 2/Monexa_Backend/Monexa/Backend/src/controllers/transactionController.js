const crypto = require("crypto");
const pool = require("../config/database");
const HttpError = require("../utils/httpError");
const { parseAmount } = require("../utils/validators");

const TRANSACTION_TYPES = ["TOPUP", "TRANSFER_OUT", "TRANSFER_IN", "PAYMENT"];

// Pastikan wallet aktif
const assertActive = (wallet, label = "Wallet") => {
    if (String(wallet.status).toUpperCase() !== "ACTIVE") {
        throw new HttpError(403, `${label} tidak aktif`);
    }
};

// Jalankan fungsi dalam satu transaksi DB (commit / rollback otomatis)
const withTransaction = async (res, failMessage, work) => {

    let connection;

    try {

        connection = await pool.getConnection();

        await connection.beginTransaction();

        const payload = await work(connection);

        await connection.commit();

        return payload;

    } catch (error) {

        if (connection) await connection.rollback();

        if (error instanceof HttpError) {
            res.status(error.status).json({ message: error.message });
            return null;
        }

        console.error(`${failMessage}:`, error);
        res.status(500).json({ message: failMessage });
        return null;

    } finally {

        if (connection) connection.release();
    }
};

// Kunci wallet milik user (FOR UPDATE) lalu kembalikan barisnya
const lockOwnWallet = async (connection, userId) => {

    const [wallets] = await connection.execute(
        `SELECT id, balance, status
         FROM wallets
         WHERE user_id = ?
         FOR UPDATE`,
        [userId]
    );

    if (wallets.length === 0) {
        throw new HttpError(404, "Wallet tidak ditemukan");
    }

    return wallets[0];
};

// Kurangi saldo secara atomik; gagal kalau saldo tidak cukup
const debit = async (connection, walletId, amount) => {

    const [result] = await connection.execute(
        `UPDATE wallets
         SET balance = balance - ?
         WHERE id = ? AND balance >= ?`,
        [amount, walletId, amount]
    );

    if (result.affectedRows === 0) {
        throw new HttpError(400, "Saldo tidak cukup");
    }
};

const credit = async (connection, walletId, amount) => {

    await connection.execute(
        `UPDATE wallets
         SET balance = balance + ?
         WHERE id = ?`,
        [amount, walletId]
    );
};

const getBalanceOf = async (connection, walletId) => {

    const [rows] = await connection.execute(
        "SELECT balance FROM wallets WHERE id = ?",
        [walletId]
    );

    return rows[0].balance;
};

const insertTransaction = async (connection, {
    walletId, type, amount, relatedWalletId = null,
    referenceCode = null, description = null
}) => {

    const [result] = await connection.execute(
        `INSERT INTO transactions
         (wallet_id, type, amount, status, related_wallet_id, reference_code, description)
         VALUES (?, ?, ?, 'SUCCESS', ?, ?, ?)`,
        [walletId, type, amount, relatedWalletId, referenceCode, description]
    );

    return result.insertId;
};

const cleanDescription = (value) =>
    typeof value === "string" && value.trim()
        ? value.trim().slice(0, 255)
        : null;


// TOP UP
const topUp = async (req, res) => {

    const amount = parseAmount(req.body.amount);

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal top-up harus angka lebih dari 0 (maksimal 2 desimal)"
        });
    }

    const payload = await withTransaction(res, "Top-up gagal", async (connection) => {

        const wallet = await lockOwnWallet(connection, req.user.id);
        assertActive(wallet);

        await credit(connection, wallet.id, amount);

        const transactionId = await insertTransaction(connection, {
            walletId: wallet.id,
            type: "TOPUP",
            amount,
            description: cleanDescription(req.body.description)
        });

        return {
            message: "Top-up berhasil",
            transaction_id: transactionId,
            amount,
            balance: await getBalanceOf(connection, wallet.id)
        };
    });

    if (payload) res.status(201).json(payload);
};


// TRANSFER ke user lain (berdasarkan email tujuan)
const transfer = async (req, res) => {

    const amount = parseAmount(req.body.amount);
    const toEmail = String(req.body.to_email || "").trim().toLowerCase();

    if (!toEmail) {
        return res.status(400).json({
            message: "Email tujuan wajib diisi"
        });
    }

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal transfer harus angka lebih dari 0 (maksimal 2 desimal)"
        });
    }

    const payload = await withTransaction(res, "Transfer gagal", async (connection) => {

        // Cari wallet pengirim & penerima
        const [senders] = await connection.execute(
            "SELECT id FROM wallets WHERE user_id = ?",
            [req.user.id]
        );

        const [receivers] = await connection.execute(
            `SELECT w.id
             FROM wallets w
             JOIN users u ON u.id = w.user_id
             WHERE u.email = ?`,
            [toEmail]
        );

        if (senders.length === 0) {
            throw new HttpError(404, "Wallet tidak ditemukan");
        }

        if (receivers.length === 0) {
            throw new HttpError(404, "Penerima tidak ditemukan");
        }

        const senderId = senders[0].id;
        const receiverId = receivers[0].id;

        if (senderId === receiverId) {
            throw new HttpError(400, "Tidak bisa transfer ke diri sendiri");
        }

        // Kunci kedua wallet dengan urutan id yang sama
        // di setiap request, supaya tidak terjadi deadlock
        const [locked] = await connection.execute(
            `SELECT id, status
             FROM wallets
             WHERE id IN (?, ?)
             ORDER BY id
             FOR UPDATE`,
            [senderId, receiverId]
        );

        const sender = locked.find((w) => w.id === senderId);
        const receiver = locked.find((w) => w.id === receiverId);

        assertActive(sender, "Wallet pengirim");
        assertActive(receiver, "Wallet penerima");

        await debit(connection, senderId, amount);
        await credit(connection, receiverId, amount);

        const referenceCode = crypto.randomUUID();
        const description = cleanDescription(req.body.description);

        const transactionId = await insertTransaction(connection, {
            walletId: senderId,
            type: "TRANSFER_OUT",
            amount,
            relatedWalletId: receiverId,
            referenceCode,
            description
        });

        await insertTransaction(connection, {
            walletId: receiverId,
            type: "TRANSFER_IN",
            amount,
            relatedWalletId: senderId,
            referenceCode,
            description
        });

        return {
            message: "Transfer berhasil",
            transaction_id: transactionId,
            reference_code: referenceCode,
            amount,
            to: toEmail,
            balance: await getBalanceOf(connection, senderId)
        };
    });

    if (payload) res.status(201).json(payload);
};


// PAYMENT (bayar merchant / tagihan)
const payment = async (req, res) => {

    const amount = parseAmount(req.body.amount);
    const merchant = cleanDescription(req.body.merchant);

    if (!merchant) {
        return res.status(400).json({
            message: "Nama merchant wajib diisi"
        });
    }

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal pembayaran harus angka lebih dari 0 (maksimal 2 desimal)"
        });
    }

    const payload = await withTransaction(res, "Pembayaran gagal", async (connection) => {

        const wallet = await lockOwnWallet(connection, req.user.id);
        assertActive(wallet);

        await debit(connection, wallet.id, amount);

        const transactionId = await insertTransaction(connection, {
            walletId: wallet.id,
            type: "PAYMENT",
            amount,
            referenceCode: crypto.randomUUID(),
            description: `Pembayaran ke ${merchant}`
        });

        return {
            message: "Pembayaran berhasil",
            transaction_id: transactionId,
            merchant,
            amount,
            balance: await getBalanceOf(connection, wallet.id)
        };
    });

    if (payload) res.status(201).json(payload);
};


// RIWAYAT TRANSAKSI  (?page=1&limit=10&type=TOPUP)
const getHistory = async (req, res) => {

    try {

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const type = req.query.type
            ? String(req.query.type).toUpperCase()
            : null;

        if (type && !TRANSACTION_TYPES.includes(type)) {
            return res.status(400).json({
                message: `Tipe harus salah satu dari: ${TRANSACTION_TYPES.join(", ")}`
            });
        }

        const filter = type ? "AND t.type = ?" : "";
        const filterParams = type ? [type] : [];

        // pool.query (bukan execute) karena LIMIT/OFFSET
        // bermasalah dengan prepared statement di beberapa versi MySQL
        const [rows] = await pool.query(
            `SELECT t.id, t.type, t.amount, t.status, t.description,
                    t.reference_code, t.created_at
             FROM transactions t
             JOIN wallets w ON w.id = t.wallet_id
             WHERE w.user_id = ? ${filter}
             ORDER BY t.created_at DESC, t.id DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, ...filterParams, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM transactions t
             JOIN wallets w ON w.id = t.wallet_id
             WHERE w.user_id = ? ${filter}`,
            [req.user.id, ...filterParams]
        );

        res.json({
            page,
            limit,
            total,
            data: rows
        });

    } catch (error) {

        console.error("Get History Error:", error);

        res.status(500).json({
            message: "Gagal mengambil riwayat transaksi"
        });
    }
};


// DETAIL TRANSAKSI (hanya milik user sendiri)
const getDetail = async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID transaksi tidak valid"
            });
        }

        const [rows] = await pool.execute(
            `SELECT t.id, t.type, t.amount, t.status, t.description,
                    t.reference_code, t.related_wallet_id, t.created_at
             FROM transactions t
             JOIN wallets w ON w.id = t.wallet_id
             WHERE t.id = ? AND w.user_id = ?`,
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Transaksi tidak ditemukan"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("Get Detail Error:", error);

        res.status(500).json({
            message: "Gagal mengambil detail transaksi"
        });
    }
};

module.exports = {
    topUp,
    transfer,
    payment,
    getHistory,
    getDetail
};
