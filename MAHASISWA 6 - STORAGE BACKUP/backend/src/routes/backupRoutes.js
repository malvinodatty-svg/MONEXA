
const express = require("express");
const crypto = require("crypto");
const { createDatabaseBackup } = require("../backupService");

const router = express.Router();

router.post("/", async (req, res) => {
    const suppliedToken = Buffer.from(
        req.get("x-backup-token") || "",
        "utf8"
    );

    const expectedToken = Buffer.from(
        process.env.BACKUP_API_TOKEN || "",
        "utf8"
    );

    if (
        expectedToken.length === 0 ||
        suppliedToken.length !== expectedToken.length ||
        !crypto.timingSafeEqual(suppliedToken, expectedToken)
    ) {
        return res.status(401).json({
            message: "Token backup tidak valid."
        });
    }

    try {
        const result = await createDatabaseBackup();

        return res.status(201).json({
            message: "Backup database berhasil diunggah ke RustFS.",
            fileName: result.fileName,
            sizeBytes: result.sizeBytes
        });
    } catch (error) {
        console.error("Backup gagal:", error.message);

        return res.status(500).json({
            message: "Backup gagal. Periksa log backend."
        });
    }
});

module.exports = router;
