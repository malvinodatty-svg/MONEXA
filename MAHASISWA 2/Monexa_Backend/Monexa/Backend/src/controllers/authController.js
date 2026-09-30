const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { isValidEmail } = require("../utils/validators");

// REGISTER
const register = async (req, res) => {

    const { name, email, password } = req.body;

    // Validasi input
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Nama, email, dan password wajib diisi"
        });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (!cleanName || cleanName.length > 100) {
        return res.status(400).json({
            message: "Nama tidak valid"
        });
    }

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
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "Email sudah terdaftar"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // User + wallet dibuat dalam satu transaksi,
        // supaya tidak ada user tanpa wallet
        await connection.beginTransaction();

        const [result] = await connection.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [cleanName, cleanEmail, hashedPassword, "user"]
        );

        await connection.execute(
            "INSERT INTO wallets (user_id, balance, currency, status) VALUES (?, 0, 'IDR', 'ACTIVE')",
            [result.insertId]
        );

        await connection.commit();

        res.status(201).json({
            message: "Register berhasil"
        });

    } catch (error) {

        if (connection) await connection.rollback();

        // Dua request register bersamaan dengan email yang sama
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Email sudah terdaftar"
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

        // Kirim token ke frontend
        res.json({
            message: "Login berhasil",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
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
