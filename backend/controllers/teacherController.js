const asyncHandler = require('../utils/asyncHandler');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

const getTeachers = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { teacherId: { $regex: search, $options: 'i' } },
    ];
  }
  const teachers = await Teacher.find(filter).populate('department', 'name code').sort({ createdAt: -1 });
  res.json(teachers);
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('department', 'name code');
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  res.json(teacher);
});

const createTeacher = asyncHandler(async (req, res) => {
  const { teacherId, fullName, email } = req.body;
  if (!teacherId || !fullName || !email) {
    res.status(400);
    throw new Error('Teacher ID, full name and email are required');
  }
  const exists = await Teacher.findOne({ $or: [{ teacherId }, { email: email.toLowerCase() }] });
  if (exists) {
    res.status(400);
    throw new Error('Teacher ID or email already exists');
  }
  const teacher = await Teacher.create({ ...req.body, email: email.toLowerCase() });

  // Optionally create a linked user account for teacher login if password provided
  if (req.body.createUserAccount && req.body.password) {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: fullName,
        email: email.toLowerCase(),
        password: req.body.password,
        role: 'teacher',
        teacher: teacher._id,
      });
    } else {
      user.role = 'teacher';
      user.teacher = teacher._id;
      if (req.body.password) user.password = req.body.password;
      await user.save();
    }
    teacher.user = user._id;
    await teacher.save();
  }

  const populated = await Teacher.findById(teacher._id).populate('department', 'name code');
  res.status(201).json(populated);
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  Object.assign(teacher, req.body);
  if (req.body.email) teacher.email = req.body.email.toLowerCase();
  await teacher.save();
  const populated = await Teacher.findById(teacher._id).populate('department', 'name code');
  res.json(populated);
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  if (teacher.user) {
    await User.findByIdAndUpdate(teacher.user, { $unset: { teacher: 1 } });
  }
  await teacher.deleteOne();
  res.json({ message: 'Teacher removed' });
});

module.exports = { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
