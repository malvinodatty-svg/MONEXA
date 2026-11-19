const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { isValidEmail } = require("../utils/validators");

const normalizePhone = (phone) => {
    if (phone === undefined || phone === null || phone === "") return null;
    return String(phone).trim();
};

const generateWalletNumber = () => {
    const left = crypto.randomInt(1000, 10000);
    const right = crypto.randomInt(1000, 10000);
    return `MX-${left}-${right}`;
};

// REGISTER
const register = async (req, res) => {

    const { name, email, password, phone } = req.body;

    // Validasi input
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Nama, email, dan password wajib diisi"
        });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (!cleanName || cleanName.length > 150) {
        return res.status(400).json({
            message: "Nama tidak valid"
        });
    }

    const cleanPhone = normalizePhone(phone);

    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
            message: "Format email tidak valid"
        });
    }

    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            message: "Password minimal 8 karakter"
        });
    }

    let connection;

    try {

        connection = await pool.getConnection();

        // Cek apakah email sudah terdaftar
        const [existingUsers] = await connection.execute(
            "SELECT id FROM users WHERE email = ? OR (phone IS NOT NULL AND phone = ?)",
            [cleanEmail, cleanPhone]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "Email atau nomor telepon sudah terdaftar"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // User + wallet dibuat dalam satu transaksi,
        // supaya tidak ada user tanpa wallet
        await connection.beginTransaction();

        const allowedRoles = ["USER", "MERCHANT", "ADMIN"];
        const requestedRole = String(req.body.role || "USER").toUpperCase();
        const role = allowedRoles.includes(requestedRole) ? requestedRole : "USER";
        const userId = crypto.randomUUID();
        const walletId = crypto.randomUUID();
        const walletNumber = generateWalletNumber();

        await connection.execute(
            "INSERT INTO users (id, name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [userId, cleanName, cleanEmail, hashedPassword, cleanPhone, role, "active"]
        );

        await connection.execute(
            "INSERT INTO wallets (id, user_id, wallet_number, balance, currency, status) VALUES (?, ?, ?, 0, 'IDR', 'active')",
            [walletId, userId, walletNumber]
        );

        await connection.commit();

        res.status(201).json({
            message: "Register berhasil",
            wallet_number: walletNumber
        });

    } catch (error) {

        if (connection) await connection.rollback();

        // Dua request register bersamaan dengan email yang sama
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Email, nomor telepon, atau wallet sudah terdaftar"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Terjadi kesalahan server"
        });

    } finally {

        if (connection) connection.release();
    }
};


// LOGIN
const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email dan password wajib diisi"
            });
        }

        // Cari user berdasarkan email
        const [users] = await pool.execute(
            "SELECT * FROM users WHERE email = ?",
            [String(email).trim().toLowerCase()]
        );

        // Kalau email tidak ditemukan
        if (users.length === 0) {
            return res.status(401).json({
                message: "Email atau password salah"
            });
        }

        const user = users[0];

        // Cek password
        const passwordMatch = await bcrypt.compare(
            String(password),
            user.password
        );

        // Kalau password salah
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Email atau password salah"
            });
        }

        // Buat JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        // Response disesuaikan dengan kontrak frontend.
        res.json({
            token,
            role: user.role
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
};


module.exports = {
    register,
    login
};
