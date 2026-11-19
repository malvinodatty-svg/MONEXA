const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    topUp,
    transfer,
    payment,
    getHistory,
    getDetail
} = require('../controllers/transactionController');

router.post('/topup', verifyToken, topUp);
router.post('/transfer', verifyToken, transfer);
router.post('/payment', verifyToken, payment);
router.get('/', verifyToken, getHistory);
router.get('/history', verifyToken, getHistory);
router.get('/:id', verifyToken, getDetail);

module.exports = router;
