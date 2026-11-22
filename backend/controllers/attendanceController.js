const asyncHandler = require('../utils/asyncHandler');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mongoose = require('mongoose');

const getAttendance = asyncHandler(async (req, res) => {
  const { date, department, semester, student, course, from, to } = req.query;
  const filter = {};
  if (date) {
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (student) filter.student = student;
  if (course) filter.course = course;

  // If requester is student, limit to their own record
  if (req.user?.role === 'student' && req.user.student) {
    filter.student = req.user.student;
  }

  const records = await Attendance.find(filter)
    .populate('student', 'studentId fullName email semester')
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('markedBy', 'name email role')
    .sort({ date: -1, createdAt: -1 });
  res.json(records);
});

const markAttendance = asyncHandler(async (req, res) => {
  // Supports single record or bulk records: { records: [...] } or single object
  const payload = Array.isArray(req.body.records) ? req.body.records : [req.body];
  if (!payload.length) {
    res.status(400);
    throw new Error('No attendance records provided');
  }

  const ops = payload.map((r) => {
    if (!r.student || !r.date || !r.status) {
      throw new Error('Each record requires student, date, and status');
    }
    const date = new Date(r.date);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const filter = {
      student: r.student,
      date: { $gte: dayStart, $lte: dayEnd },
    };
    if (r.course) filter.course = r.course;
    return {
      updateOne: {
        filter,
        update: {
          $set: {
            student: r.student,
            department: r.department || undefined,
            course: r.course || undefined,
            semester: r.semester != null ? Number(r.semester) : undefined,
            date,
            status: r.status,
            markedBy: req.user?._id,
            remarks: r.remarks || '',
          },
        },
        upsert: true,
      },
    };
  });

  await Attendance.bulkWrite(ops);
  res.status(201).json({ message: 'Attendance saved successfully', count: payload.length });
});

const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Attendance record not found');
  }
  Object.assign(record, req.body);
  if (req.body.date) record.date = new Date(req.body.date);
  if (req.user?._id) record.markedBy = req.user._id;
  await record.save();
  const populated = await Attendance.findById(record._id)
    .populate('student', 'studentId fullName')
    .populate('department', 'name code')
    .populate('course', 'name code');
  res.json(populated);
});

const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.query.student || (req.user?.role === 'student' ? String(req.user.student) : null);
  if (!studentId) {
    res.status(400);
    throw new Error('Student ID is required');
  }
  const match = { student: new mongoose.Types.ObjectId(studentId) };
  const records = await Attendance.find(match).sort({ date: -1 });
  const total = records.length;
  const present = records.filter((r) => r.status === 'Present').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const percentage = total ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

  // Monthly analytics
  const monthly = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    studentId,
    summary: { total, present, absent, late, percentage },
    monthly: monthly.map((m) => ({
      year: m._id.year,
      month: m._id.month,
      total: m.total,
      present: m.present,
      absent: m.absent,
      late: m.late,
      percentage: m.total ? Number((((m.present + m.late) / m.total) * 100).toFixed(1)) : 0,
    })),
    history: records,
  });
});

const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { department, semester, month, year } = req.query;
  const match = {};
  if (department) match.department = new mongoose.Types.ObjectId(department);
  if (semester) match.semester = Number(semester);
  if (month && year) {
    const y = Number(year); const m = Number(month) - 1;
    match.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
  } else if (year) {
    const y = Number(year);
    match.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
  }

  const [overall, monthly] = await Promise.all([
    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        },
      },
    ]),
    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const o = overall[0] || { total: 0, present: 0, absent: 0, late: 0 };
  res.json({
    overall: {
      ...o,
      percentage: o.total ? Number((((o.present + o.late) / o.total) * 100).toFixed(1)) : 0,
    },
    monthly: monthly.map((m) => ({ year: m._id.year, month: m._id.month, total: m.total, present: m.present, absent: m.absent, late: m.late })),
  });
});

module.exports = { getAttendance, markAttendance, updateAttendance, getStudentAttendanceSummary, getAttendanceAnalytics };
