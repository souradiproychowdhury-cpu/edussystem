const asyncHandler = require('../utils/asyncHandler');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');

const getStudents = asyncHandler(async (req, res) => {
  const { search, department, semester, enrollmentYear, status, sort, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (status) filter.academicStatus = status;
  if (enrollmentYear) {
    const year = Number(enrollmentYear);
    filter.enrollmentDate = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) };
  }
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { fullName: 1 },
    name_desc: { fullName: -1 },
    semester_asc: { semester: 1 },
    semester_desc: { semester: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Student.countDocuments(filter),
  ]);

  res.json({ students, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1, limit: limitNum });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('department', 'name code')
    .populate('course', 'name code credits');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const [attendanceRecords, examResults, fees] = await Promise.all([
    Attendance.find({ student: student._id }).sort({ date: -1 }).limit(200).populate('course', 'name code'),
    Result.find({ student: student._id }).sort({ createdAt: -1 }).populate('examination', 'name subject date totalMarks semester'),
    Fee.findOne({ student: student._id }),
  ]);

  const totalAttendance = attendanceRecords.length;
  const presentLike = attendanceRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const attendancePercentage = totalAttendance ? Number(((presentLike / totalAttendance) * 100).toFixed(1)) : 0;

  res.json({
    student,
    attendance: {
      records: attendanceRecords,
      summary: {
        total: totalAttendance,
        present: attendanceRecords.filter((a) => a.status === 'Present').length,
        absent: attendanceRecords.filter((a) => a.status === 'Absent').length,
        late: attendanceRecords.filter((a) => a.status === 'Late').length,
        percentage: attendancePercentage,
      },
    },
    examResults,
    fees,
  });
});

const createStudent = asyncHandler(async (req, res) => {
  const { studentId, fullName, email } = req.body;
  if (!studentId || !fullName || !email) {
    res.status(400);
    throw new Error('Student ID, full name and email are required');
  }
  const exists = await Student.findOne({ $or: [{ studentId }, { email: email.toLowerCase() }] });
  if (exists) {
    res.status(400);
    throw new Error('Student ID or email already exists');
  }
  const payload = { ...req.body, email: email.toLowerCase() };
  if (!payload.mobile && payload.phone) payload.mobile = payload.phone;
  if (!payload.phone && payload.mobile) payload.phone = payload.mobile;
  if (!payload.enrollmentDate && payload.admissionYear) payload.enrollmentDate = new Date(Number(payload.admissionYear), 0, 2);
  const student = await Student.create(payload);

  if (req.body.totalCourseFees != null || req.body.totalFees != null) {
    const total = Number(req.body.totalCourseFees ?? req.body.totalFees) || 0;
    const paid = Number(req.body.paidFees ?? req.body.paidAmount) || 0;
    await Fee.findOneAndUpdate(
      { student: student._id },
      { student: student._id, totalFees: total, paidAmount: paid },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (req.body.createUserAccount && req.body.password) {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ name: fullName, email: email.toLowerCase(), password: req.body.password, role: 'student', student: student._id });
    } else {
      user.role = 'student';
      user.student = student._id;
      if (req.body.password) user.password = req.body.password;
      await user.save();
    }
    student.user = user._id;
    await student.save();
  }

  const populated = await Student.findById(student._id).populate('department', 'name code').populate('course', 'name code');
  res.status(201).json(populated);
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  Object.assign(student, req.body);
  if (req.body.email) student.email = req.body.email.toLowerCase();
  if (req.body.mobile && !req.body.phone) student.phone = req.body.mobile;
  if (req.body.phone && !req.body.mobile) student.mobile = req.body.phone;
  if (req.body.admissionYear && !req.body.enrollmentDate) student.enrollmentDate = new Date(Number(req.body.admissionYear), 0, 2);
  await student.save();
  const populated = await Student.findById(student._id).populate('department', 'name code').populate('course', 'name code');
  res.json(populated);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  await Promise.all([
    Attendance.deleteMany({ student: student._id }),
    Result.deleteMany({ student: student._id }),
    Fee.deleteMany({ student: student._id }),
  ]);
  if (student.user) await User.findByIdAndUpdate(student.user, { $unset: { student: 1 } });
  await student.deleteOne();
  res.json({ message: 'Student removed' });
});

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
