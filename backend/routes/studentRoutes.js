const express = require('express');
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getStudents);
router.get('/:id', protect, getStudentById);
router.post('/', protect, authorize('admin'), createStudent);
router.put('/:id', protect, authorize('admin', 'teacher'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;
