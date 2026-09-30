const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "MONEXA CloudWallet API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);

// Route tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        message: "Endpoint tidak ditemukan"
    });
});

// Error handler global (contoh: JSON body rusak)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            message: "Format JSON tidak valid"
        });
    }

    console.error(err);

    res.status(500).json({
        message: "Terjadi kesalahan server"
    });
});

module.exports = app;
