const express = require('express');
const { getExaminations, getExaminationById, createExamination, updateExamination, deleteExamination } = require('../controllers/examinationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getExaminations);
router.get('/:id', protect, getExaminationById);
router.post('/', protect, authorize('admin', 'teacher'), createExamination);
router.put('/:id', protect, authorize('admin', 'teacher'), updateExamination);
router.delete('/:id', protect, authorize('admin'), deleteExamination);

module.exports = router;
