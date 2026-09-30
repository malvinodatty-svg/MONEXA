const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Contoh route wallet balance
router.get('/balance', verifyToken, (req, res) => {
    res.json({ message: 'Endpoint balance wallet', userId: req.user.userId });
});

module.exports = router;
