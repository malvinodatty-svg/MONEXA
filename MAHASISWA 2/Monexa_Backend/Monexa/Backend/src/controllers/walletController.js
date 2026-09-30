const pool = require("../config/database");

const getBalance = async (req, res) => {

    try {

        const userId = req.user.id;

        const [wallets] = await pool.execute(
            `SELECT id, balance, currency, status
             FROM wallets
             WHERE user_id = ?`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                message: "Wallet tidak ditemukan"
            });
        }

        res.json({
            wallet_id: wallets[0].id,
            balance: wallets[0].balance,
            currency: wallets[0].currency,
            status: wallets[0].status
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Gagal mengambil saldo"
        });
    }
};

module.exports = {
    getBalance
};