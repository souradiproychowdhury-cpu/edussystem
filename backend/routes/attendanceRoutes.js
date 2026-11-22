const express = require('express');
const { getAttendance, markAttendance, updateAttendance, getStudentAttendanceSummary, getAttendanceAnalytics } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAttendance);
router.get('/analytics', protect, getAttendanceAnalytics);
router.get('/student/:studentId', protect, getStudentAttendanceSummary);
router.post('/', protect, authorize('admin', 'teacher'), markAttendance);
router.put('/:id', protect, authorize('admin', 'teacher'), updateAttendance);

module.exports = router;
