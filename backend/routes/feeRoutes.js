const express = require('express');
const { getFees, getFeeById, createFee, updateFee, addPayment, getReceipt } = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getFees);
router.get('/:id', protect, getFeeById);
router.get('/:id/receipt/:receiptNo', protect, getReceipt);
router.post('/', protect, authorize('admin'), createFee);
router.post('/:id/payments', protect, authorize('admin'), addPayment);
router.put('/:id', protect, authorize('admin'), updateFee);

module.exports = router;
