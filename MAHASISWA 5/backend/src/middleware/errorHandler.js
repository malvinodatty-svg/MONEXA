// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error("Unhandled Error:", err);

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            message: "Format JSON request tidak valid"
        });
    }

    const statusCode = err.status || 500;
    const message = err.message || "Terjadi kesalahan pada server";

    res.status(statusCode).json({
        message
    });
};

module.exports = errorHandler;
