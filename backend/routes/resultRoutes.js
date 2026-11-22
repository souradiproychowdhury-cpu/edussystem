const express = require('express');
const { getResults, getResultById, createResult, updateResult, deleteResult } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getResults);
router.get('/:id', protect, getResultById);
router.post('/', protect, authorize('admin', 'teacher'), createResult);
router.put('/:id', protect, authorize('admin', 'teacher'), updateResult);
router.delete('/:id', protect, authorize('admin'), deleteResult);

module.exports = router;
