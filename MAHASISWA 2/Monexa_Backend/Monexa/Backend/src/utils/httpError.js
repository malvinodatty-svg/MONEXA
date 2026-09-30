// Error dengan status code, dipakai untuk membatalkan transaksi DB
// dan tetap membalas client dengan pesan yang jelas.
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = HttpError;
