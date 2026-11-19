const crypto = require("crypto");
const pool = require("../config/database");
const HttpError = require("../utils/httpError");
const { parseAmount } = require("../utils/validators");

const TRANSACTION_TYPES = ["topup", "transfer", "payment"];
const STATUS_MAP = {
    PENDING: "PENDING",
    SUKSES: "SUCCESS",
    GAGAL: "FAILED"
};

const assertActive = (wallet, label = "Wallet") => {
    if (wallet.status !== "active") {
        throw new HttpError(403, `${label} tidak aktif`);
    }
};

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
            res.status(error.status).json({
                status: "FAILED",
                message: error.message
            });
            return null;
        }

        console.error(`${failMessage}:`, error);
        res.status(500).json({ message: failMessage });
        return null;
    } finally {
        if (connection) connection.release();
    }
};

const cleanText = (value) =>
    typeof value === "string" && value.trim()
        ? value.trim().slice(0, 255)
        : null;

const formatMoney = (value) => Number(value).toFixed(4);
const toApiAmount = (value) => Number(Number(value).toFixed(4));

const parseMetadata = (metadata) => {
    if (!metadata) return {};
    if (typeof metadata === "object") return metadata;

    try {
        return JSON.parse(metadata);
    } catch (error) {
        return {};
    }
};

const formatListTime = (value) => {
    const date = new Date(value);
    const today = new Date();
    const time = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta"
    }).format(date).replace(".", ":");

    if (date.toDateString() === today.toDateString()) {
        return `Hari ini, ${time}`;
    }

    const day = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Jakarta"
    }).format(date);

    return `${day}, ${time}`;
};

const formatTimestamp = (value) =>
    new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
        timeZoneName: "short"
    }).format(new Date(value)).replace(".", ":");

const buildTitle = (tx, metadata) => {
    if (tx.type === "transfer") {
        return `Transfer ke ${tx.destination_name || "Penerima"}`;
    }

    if (tx.type === "topup") {
        return `Top Up via ${metadata.method || metadata.channel || "Manual"}`;
    }

    return `Bayar Merchant ${metadata.merchantName || metadata.merchantCode || metadata.merchant || "Merchant"}`;
};

const mapTransaction = (tx, ownWalletId, detailed = false) => {
    const metadata = parseMetadata(tx.metadata);
    const isOutgoing = tx.source_wallet_id === ownWalletId;
    const signedAmount = isOutgoing ? -Number(tx.amount) : Number(tx.amount);
    const base = {
        id: tx.reference_id,
        type: String(tx.type).toUpperCase(),
        title: buildTitle(tx, metadata),
        amount: toApiAmount(signedAmount),
        status: STATUS_MAP[tx.status] || tx.status
    };

    if (detailed) {
        return {
            ...base,
            timestamp: formatTimestamp(tx.created_at),
            receiptUrl: metadata.receiptUrl || null
        };
    }

    return {
        ...base,
        time: formatListTime(tx.created_at)
    };
};

const generateReferenceId = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const sequence = crypto.randomInt(1, 10000).toString().padStart(4, "0");
    return `TRX-${today}-${sequence}`;
};

const lockOwnWallet = async (connection, userId) => {
    const [wallets] = await connection.execute(
        `SELECT id, wallet_number, balance, status
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

const getBalanceOf = async (connection, walletId) => {
    const [rows] = await connection.execute(
        "SELECT balance FROM wallets WHERE id = ?",
        [walletId]
    );

    return rows[0].balance;
};

const createTransaction = async (connection, {
    sourceWalletId = null,
    destinationWalletId = null,
    amount,
    fee = 0,
    type,
    notes = null,
    metadata = null
}) => {
    const id = crypto.randomUUID();
    const referenceId = generateReferenceId();

    await connection.execute(
        `INSERT INTO transactions
         (id, reference_id, source_wallet_id, destination_wallet_id, amount, fee, type, status, notes, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'SUKSES', ?, ?)`,
        [
            id,
            referenceId,
            sourceWalletId,
            destinationWalletId,
            amount,
            fee,
            type,
            notes,
            metadata ? JSON.stringify(metadata) : null
        ]
    );

    return { id, referenceId };
};

const insertLedger = async (connection, {
    transactionId,
    walletId,
    type,
    amount,
    balanceBefore,
    balanceAfter
}) => {
    await connection.execute(
        `INSERT INTO ledger_entries
         (id, transaction_id, wallet_id, type, amount, balance_before, balance_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            crypto.randomUUID(),
            transactionId,
            walletId,
            type,
            amount,
            balanceBefore,
            balanceAfter
        ]
    );
};

const creditWallet = async (connection, wallet, amount, transactionId) => {
    const before = Number(wallet.balance);
    const after = before + amount;

    await connection.execute(
        "UPDATE wallets SET balance = ? WHERE id = ?",
        [formatMoney(after), wallet.id]
    );

    await insertLedger(connection, {
        transactionId,
        walletId: wallet.id,
        type: "credit",
        amount,
        balanceBefore: formatMoney(before),
        balanceAfter: formatMoney(after)
    });

    return after;
};

const debitWallet = async (connection, wallet, amount, transactionId) => {
    const before = Number(wallet.balance);

    if (before < amount) {
        throw new HttpError(400, "Saldo tidak cukup");
    }

    const after = before - amount;

    await connection.execute(
        "UPDATE wallets SET balance = ? WHERE id = ?",
        [formatMoney(after), wallet.id]
    );

    await insertLedger(connection, {
        transactionId,
        walletId: wallet.id,
        type: "debit",
        amount,
        balanceBefore: formatMoney(before),
        balanceAfter: formatMoney(after)
    });

    return after;
};

// TOP UP
const topUp = async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const method = cleanText(req.body.method || req.body.channel) || "Manual";

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal top-up harus angka lebih dari 0 (maksimal 4 desimal)"
        });
    }

    const payload = await withTransaction(res, "Top-up gagal", async (connection) => {
        const wallet = await lockOwnWallet(connection, req.user.id);
        assertActive(wallet);

        const tx = await createTransaction(connection, {
            destinationWalletId: wallet.id,
            amount,
            type: "topup",
            notes: cleanText(req.body.note || req.body.notes || req.body.description),
            metadata: { method }
        });

        const balance = await creditWallet(connection, wallet, amount, tx.id);

        return {
            transactionId: tx.referenceId,
            status: "SUCCESS",
            balance: toApiAmount(balance)
        };
    });

    if (payload) res.status(201).json(payload);
};

// TRANSFER ke user lain berdasarkan email, phone, atau wallet_number
const transfer = async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const recipient = cleanText(
        req.body.recipient ||
        req.body.to ||
        req.body.to_email ||
        req.body.to_phone ||
        req.body.to_wallet_number
    );

    if (!recipient) {
        return res.status(400).json({
            message: "Tujuan transfer wajib diisi"
        });
    }

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal transfer harus angka lebih dari 0 (maksimal 4 desimal)"
        });
    }

    const payload = await withTransaction(res, "Transfer gagal", async (connection) => {
        const [senders] = await connection.execute(
            "SELECT id FROM wallets WHERE user_id = ?",
            [req.user.id]
        );

        const [receivers] = await connection.execute(
            `SELECT w.id
             FROM wallets w
             JOIN users u ON u.id = w.user_id
             WHERE u.email = ? OR u.phone = ? OR u.name = ? OR w.wallet_number = ?`,
            [recipient.toLowerCase(), recipient, recipient, recipient]
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

        const [locked] = await connection.execute(
            `SELECT id, wallet_number, balance, status
             FROM wallets
             WHERE id IN (?, ?)
             ORDER BY id
             FOR UPDATE`,
            [senderId, receiverId]
        );

        const sender = locked.find((wallet) => wallet.id === senderId);
        const receiver = locked.find((wallet) => wallet.id === receiverId);

        assertActive(sender, "Wallet pengirim");
        assertActive(receiver, "Wallet penerima");

        const tx = await createTransaction(connection, {
            sourceWalletId: senderId,
            destinationWalletId: receiverId,
            amount,
            type: "transfer",
            notes: cleanText(req.body.note || req.body.notes || req.body.description)
        });

        const senderBalance = await debitWallet(connection, sender, amount, tx.id);
        await creditWallet(connection, receiver, amount, tx.id);

        return {
            transactionId: tx.referenceId,
            status: "SUCCESS",
            balance: toApiAmount(senderBalance)
        };
    });

    if (payload) res.status(201).json(payload);
};

// PAYMENT (bayar merchant / tagihan)
const payment = async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const merchant = cleanText(req.body.merchantCode || req.body.merchant);

    if (!merchant) {
        return res.status(400).json({
            message: "Nama merchant wajib diisi"
        });
    }

    if (amount === null) {
        return res.status(400).json({
            message: "Nominal pembayaran harus angka lebih dari 0 (maksimal 4 desimal)"
        });
    }

    const payload = await withTransaction(res, "Pembayaran gagal", async (connection) => {
        const wallet = await lockOwnWallet(connection, req.user.id);
        assertActive(wallet);

        const tx = await createTransaction(connection, {
            sourceWalletId: wallet.id,
            amount,
            type: "payment",
            notes: cleanText(req.body.note || req.body.notes) || `Pembayaran ke ${merchant}`,
            metadata: { merchantCode: merchant }
        });

        const balance = await debitWallet(connection, wallet, amount, tx.id);

        return {
            transactionId: tx.referenceId,
            status: "SUCCESS",
            balance: toApiAmount(balance)
        };
    });

    if (payload) res.status(201).json(payload);
};

// RIWAYAT TRANSAKSI (?page=1&limit=10&type=topup)
const getHistory = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;
        const type = req.query.type ? String(req.query.type).toLowerCase() : null;

        if (type && !TRANSACTION_TYPES.includes(type)) {
            return res.status(400).json({
                message: `Tipe harus salah satu dari: ${TRANSACTION_TYPES.join(", ")}`
            });
        }

        const filter = type ? "AND t.type = ?" : "";
        const filterParams = type ? [type] : [];

        const [wallets] = await pool.execute(
            "SELECT id FROM wallets WHERE user_id = ?",
            [req.user.id]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                message: "Wallet tidak ditemukan"
            });
        }

        const walletId = wallets[0].id;

        const [rows] = await pool.query(
            `SELECT t.id, t.reference_id, t.type, t.amount, t.fee, t.status,
                    t.notes, t.source_wallet_id, t.destination_wallet_id,
                    t.metadata, t.created_at,
                    destination_user.name AS destination_name
             FROM transactions t
             LEFT JOIN wallets destination_wallet ON destination_wallet.id = t.destination_wallet_id
             LEFT JOIN users destination_user ON destination_user.id = destination_wallet.user_id
             WHERE (t.source_wallet_id = ? OR t.destination_wallet_id = ?) ${filter}
             ORDER BY t.created_at DESC, t.id DESC
             LIMIT ? OFFSET ?`,
            [walletId, walletId, ...filterParams, limit, offset]
        );

        res.json(rows.map((row) => mapTransaction(row, walletId)));
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
        const id = String(req.params.id || "").trim();

        if (!id) {
            return res.status(400).json({
                message: "ID transaksi tidak valid"
            });
        }

        const [wallets] = await pool.execute(
            "SELECT id FROM wallets WHERE user_id = ?",
            [req.user.id]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                message: "Wallet tidak ditemukan"
            });
        }

        const walletId = wallets[0].id;

        const [rows] = await pool.execute(
            `SELECT t.id, t.reference_id, t.type, t.amount, t.fee, t.status,
                    t.notes, t.metadata, t.source_wallet_id, t.destination_wallet_id,
                    t.created_at,
                    destination_user.name AS destination_name
             FROM transactions t
             LEFT JOIN wallets destination_wallet ON destination_wallet.id = t.destination_wallet_id
             LEFT JOIN users destination_user ON destination_user.id = destination_wallet.user_id
             WHERE (t.id = ? OR t.reference_id = ?)
               AND (t.source_wallet_id = ? OR t.destination_wallet_id = ?)
             LIMIT 1`,
            [id, id, walletId, walletId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Transaksi tidak ditemukan"
            });
        }

        res.json(mapTransaction(rows[0], walletId, true));
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
