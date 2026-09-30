const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { topupWallet } = require('../controllers/transactionController');

router.post('/topup', verifyToken, topupWallet);

module.exports = router;
