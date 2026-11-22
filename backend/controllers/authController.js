const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password and role are required');
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      student: user.student,
      teacher: user.teacher,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      student: user.student,
      teacher: user.teacher,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('student').populate('teacher');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  // Interface-level support: in production this would send a reset email/token.
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Avoid leaking existence; still respond success for UX.
    return res.json({ message: 'If an account exists for this email, password reset instructions have been sent.' });
  }
  return res.json({ message: 'If an account exists for this email, password reset instructions have been sent.' });
});

module.exports = { register, login, getProfile, forgotPassword };
