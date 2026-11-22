const asyncHandler = require('../utils/asyncHandler');
const Examination = require('../models/Examination');

const getExaminations = asyncHandler(async (req, res) => {
  const { department, semester, course } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (course) filter.course = course;
  const exams = await Examination.find(filter)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .sort({ date: -1, createdAt: -1 });
  res.json(exams);
});

const getExaminationById = asyncHandler(async (req, res) => {
  const exam = await Examination.findById(req.params.id)
    .populate('department', 'name code')
    .populate('course', 'name code');
  if (!exam) {
    res.status(404);
    throw new Error('Examination not found');
  }
  res.json(exam);
});

const createExamination = asyncHandler(async (req, res) => {
  const { name, subject, date } = req.body;
  if (!name || !subject || !date) {
    res.status(400);
    throw new Error('Name, subject and date are required');
  }
  const exam = await Examination.create(req.body);
  const populated = await Examination.findById(exam._id).populate('department', 'name code').populate('course', 'name code');
  res.status(201).json(populated);
});

const updateExamination = asyncHandler(async (req, res) => {
  const exam = await Examination.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Examination not found');
  }
  Object.assign(exam, req.body);
  await exam.save();
  const populated = await Examination.findById(exam._id).populate('department', 'name code').populate('course', 'name code');
  res.json(populated);
});

const deleteExamination = asyncHandler(async (req, res) => {
  const exam = await Examination.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Examination not found');
  }
  await exam.deleteOne();
  res.json({ message: 'Examination removed' });
});

module.exports = { getExaminations, getExaminationById, createExamination, updateExamination, deleteExamination };
