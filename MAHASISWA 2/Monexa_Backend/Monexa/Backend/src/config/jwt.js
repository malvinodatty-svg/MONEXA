// Konfigurasi JWT (opsional helper / konstanta token)
module.exports = {
    secret: process.env.JWT_SECRET || "default_secret_key",
    expiresIn: "1h"
};
