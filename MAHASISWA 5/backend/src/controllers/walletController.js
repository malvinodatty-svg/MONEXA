const pool = require("../config/database");

const getBalance = async (req, res) => {

    try {

        const userId = req.user.id;

        const [wallets] = await pool.execute(
            `SELECT id, wallet_number, balance, currency, status
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
            balance: Number(wallets[0].balance),
            walletId: wallets[0].wallet_number
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
