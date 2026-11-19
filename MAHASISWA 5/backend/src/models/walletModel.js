// Model / Query Helper untuk Entitas Wallet
const pool = require("../config/database");

const findByUserId = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT * FROM wallets WHERE user_id = ?",
        [userId]
    );
    return rows[0] || null;
};

const createWallet = async (connection, { id, userId, walletNumber }) => {
    await connection.execute(
        "INSERT INTO wallets (id, user_id, wallet_number, balance, currency, status) VALUES (?, ?, ?, 0, 'IDR', 'active')",
        [id, userId, walletNumber]
    );
};

module.exports = {
    findByUserId,
    createWallet
};
