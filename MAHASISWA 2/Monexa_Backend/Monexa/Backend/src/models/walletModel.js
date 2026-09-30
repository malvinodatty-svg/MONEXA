// Model / Query Helper untuk Entitas Wallet
const pool = require("../config/database");

const findByUserId = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT * FROM wallets WHERE user_id = ?",
        [userId]
    );
    return rows[0] || null;
};

const createWallet = async (connection, userId) => {
    await connection.execute(
        "INSERT INTO wallets (user_id, balance, currency, status) VALUES (?, 0, 'IDR', 'ACTIVE')",
        [userId]
    );
};

module.exports = {
    findByUserId,
    createWallet
};
