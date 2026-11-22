const asyncHandler = require('../utils/asyncHandler');
const Result = require('../models/Result');
const Examination = require('../models/Examination');

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const buildResultData = (body, exam) => {
  const marksObtained = Number(body.marksObtained);
  const totalMarks = Number(body.totalMarks ?? exam?.totalMarks ?? 100);
  const percentage = totalMarks > 0 ? Number(((marksObtained / totalMarks) * 100).toFixed(2)) : 0;
  const grade = calculateGrade(percentage);
  const passing = exam?.passingMarks != null ? Number(exam.passingMarks) : (totalMarks * 0.4);
  const passFail = marksObtained >= passing ? 'Pass' : 'Fail';
  return { marksObtained, totalMarks, percentage, grade, passFail, status: passFail };
};

const getResults = asyncHandler(async (req, res) => {
  const { student, studentId, examination, semester } = req.query;
  const filter = {};
  if (student || studentId) filter.student = student || studentId;
  if (examination) filter.examination = examination;
  if (semester) filter.semester = Number(semester);
  if (req.user?.role === 'student' && req.user.student) {
    filter.student = req.user.student;
  }
  const results = await Result.find(filter)
    .populate('student', 'studentId fullName email semester')
    .populate('examination', 'name subject date totalMarks semester type')
    .sort({ createdAt: -1 });
  res.json(results);
});

const getResultById = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('student', 'studentId fullName email semester department')
    .populate('examination', 'name subject date totalMarks semester type');
  if (!result) { res.status(404); throw new Error('Result not found'); }
  res.json(result);
});

const createResult = asyncHandler(async (req, res) => {
  const { examination, student, marksObtained } = req.body;
  if (!examination || !student || marksObtained == null) {
    res.status(400);
    throw new Error('Examination, student and marks obtained are required');
  }
  const exam = await Examination.findById(examination);
  if (!exam) { res.status(404); throw new Error('Examination not found'); }
  const computed = buildResultData(req.body, exam);
  const existing = await Result.findOne({ examination, student, subject: req.body.subject || exam.subject });
  let result;
  const payload = {
    ...req.body,
    subject: req.body.subject || exam.subject,
    semester: req.body.semester ?? exam.semester,
    ...computed,
  };
  if (existing) {
    Object.assign(existing, payload);
    result = await existing.save();
  } else {
    result = await Result.create(payload);
  }
  const populated = await Result.findById(result._id)
    .populate('student', 'studentId fullName email')
    .populate('examination', 'name subject date totalMarks semester type');
  res.status(201).json(populated);
});

const updateResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }
  const exam = await Examination.findById(req.body.examination || result.examination);
  Object.assign(result, req.body);
  if (req.body.marksObtained != null || req.body.totalMarks != null || exam) {
    const computed = buildResultData({ ...result.toObject(), ...req.body }, exam);
    Object.assign(result, computed);
  }
  await result.save();
  const populated = await Result.findById(result._id)
    .populate('student', 'studentId fullName email')
    .populate('examination', 'name subject date totalMarks semester type');
  res.json(populated);
});

const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }
  await result.deleteOne();
  res.json({ message: 'Result removed' });
});

module.exports = { getResults, getResultById, createResult, updateResult, deleteResult };
