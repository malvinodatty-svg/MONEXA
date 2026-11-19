// Model / Query Helper untuk Entitas Transaksi
const pool = require("../config/database");

const insertTx = async (connection, {
    id,
    referenceId,
    sourceWalletId = null,
    destinationWalletId = null,
    amount,
    fee = 0,
    type,
    status = "SUKSES",
    notes = null,
    metadata = null
}) => {
    await connection.execute(
        `INSERT INTO transactions
         (id, reference_id, source_wallet_id, destination_wallet_id, amount, fee, type, status, notes, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            referenceId,
            sourceWalletId,
            destinationWalletId,
            amount,
            fee,
            type,
            status,
            notes,
            metadata ? JSON.stringify(metadata) : null
        ]
    );
    return id;
};

module.exports = {
    insertTx
};
