const express = require('express');
const { getTimetables, getTimetableById, createTimetable, updateTimetable, deleteTimetable } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTimetables);
router.get('/:id', protect, getTimetableById);
router.post('/', protect, authorize('admin', 'teacher'), createTimetable);
router.put('/:id', protect, authorize('admin', 'teacher'), updateTimetable);
router.delete('/:id', protect, authorize('admin'), deleteTimetable);

module.exports = router;
