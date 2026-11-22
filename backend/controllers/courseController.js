const asyncHandler = require('../utils/asyncHandler');
const Course = require('../models/Course');

const getCourses = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  const courses = await Course.find(filter)
    .populate('department', 'name code')
    .populate('teacher', 'fullName teacherId')
    .sort({ createdAt: -1 });
  res.json(courses);
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('department', 'name code')
    .populate('teacher', 'fullName teacherId email');
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  res.json(course);
});

const createCourse = asyncHandler(async (req, res) => {
  const { name, code, department } = req.body;
  if (!name || !code || !department) {
    res.status(400);
    throw new Error('Name, code and department are required');
  }
  const exists = await Course.findOne({ code: code.toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('Course code already exists');
  }
  const course = await Course.create({
    ...req.body,
    code: code.toUpperCase(),
  });
  const populated = await Course.findById(course._id).populate('department', 'name code').populate('teacher', 'fullName teacherId');
  res.status(201).json(populated);
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  Object.assign(course, req.body);
  if (req.body.code) course.code = req.body.code.toUpperCase();
  await course.save();
  const populated = await Course.findById(course._id).populate('department', 'name code').populate('teacher', 'fullName teacherId');
  res.json(populated);
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  await course.deleteOne();
  res.json({ message: 'Course removed' });
});

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
