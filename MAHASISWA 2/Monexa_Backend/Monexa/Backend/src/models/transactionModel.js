// Model / Query Helper untuk Entitas Transaksi
const pool = require("../config/database");

const insertTx = async (connection, {
    walletId, type, amount, status = "SUCCESS", relatedWalletId = null, referenceCode = null, description = null
}) => {
    const [result] = await connection.execute(
        `INSERT INTO transactions
         (wallet_id, type, amount, status, related_wallet_id, reference_code, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [walletId, type, amount, status, relatedWalletId, referenceCode, description]
    );
    return result.insertId;
};

module.exports = {
    insertTx
};
