const asyncHandler = require('../utils/asyncHandler');
const Timetable = require('../models/Timetable');

const getTimetables = asyncHandler(async (req, res) => {
  const { department, semester, day, teacher } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (day) filter.day = day;
  if (teacher) filter.teacher = teacher;

  // student/teacher specific views can be narrowed by query params from frontend
  const items = await Timetable.find(filter)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('teacher', 'fullName teacherId')
    .sort({ day: 1, startTime: 1 });
  res.json(items);
});

const getTimetableById = asyncHandler(async (req, res) => {
  const item = await Timetable.findById(req.params.id)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('teacher', 'fullName teacherId');
  if (!item) {
    res.status(404);
    throw new Error('Timetable entry not found');
  }
  res.json(item);
});

const createTimetable = asyncHandler(async (req, res) => {
  const { day, startTime, endTime } = req.body;
  if (!day || !startTime || !endTime) {
    res.status(400);
    throw new Error('Day, start time and end time are required');
  }
  const item = await Timetable.create(req.body);
  const populated = await Timetable.findById(item._id)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('teacher', 'fullName teacherId');
  res.status(201).json(populated);
});

const updateTimetable = asyncHandler(async (req, res) => {
  const item = await Timetable.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Timetable entry not found');
  }
  Object.assign(item, req.body);
  await item.save();
  const populated = await Timetable.findById(item._id)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('teacher', 'fullName teacherId');
  res.json(populated);
});

const deleteTimetable = asyncHandler(async (req, res) => {
  const item = await Timetable.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Timetable entry not found');
  }
  await item.deleteOne();
  res.json({ message: 'Timetable entry removed' });
});

module.exports = { getTimetables, getTimetableById, createTimetable, updateTimetable, deleteTimetable };
