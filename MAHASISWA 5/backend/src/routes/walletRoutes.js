const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getBalance } = require('../controllers/walletController');
const { transfer, topUp, payment } = require('../controllers/transactionController');

router.get('/balance', verifyToken, getBalance);
router.post('/transfer', verifyToken, transfer);
router.post('/topup', verifyToken, topUp);
router.post('/payment', verifyToken, payment);

module.exports = router;
