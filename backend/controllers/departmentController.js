const asyncHandler = require('../utils/asyncHandler');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('headOfDepartment', 'fullName teacherId email').sort({ name: 1 });
  const enriched = await Promise.all(
    departments.map(async (d) => {
      const [coursesCount, studentsCount, teachersCount] = await Promise.all([
        Course.countDocuments({ department: d._id }),
        Student.countDocuments({ department: d._id }),
        Teacher.countDocuments({ department: d._id }),
      ]);
      return { ...d.toObject(), stats: { courses: coursesCount, students: studentsCount, teachers: teachersCount } };
    })
  );
  res.json(enriched);
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('headOfDepartment', 'fullName teacherId email');
  if (!department) { res.status(404); throw new Error('Department not found'); }
  const [courses, teachers, students] = await Promise.all([
    Course.find({ department: department._id }).populate('teacher', 'fullName teacherId'),
    Teacher.find({ department: department._id }).select('teacherId fullName email subjects'),
    Student.find({ department: department._id }).select('studentId fullName email semester academicStatus course'),
  ]);
  res.json({ ...department.toObject(), courses, teachers, students });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) { res.status(400); throw new Error('Name and code are required'); }
  const exists = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (exists) { res.status(400); throw new Error('Department name or code already exists'); }
  const payload = { ...req.body, code: code.toUpperCase() };
  if (payload.headOfDepartment === '') payload.headOfDepartment = null;
  const department = await Department.create(payload);
  const populated = await Department.findById(department._id).populate('headOfDepartment', 'fullName teacherId email');
  res.status(201).json(populated);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) { res.status(404); throw new Error('Department not found'); }
  const payload = { ...req.body };
  if (payload.code) payload.code = payload.code.toUpperCase();
  if (payload.headOfDepartment === '') payload.headOfDepartment = null;
  Object.assign(department, payload);
  await department.save();
  const populated = await Department.findById(department._id).populate('headOfDepartment', 'fullName teacherId email');
  res.json(populated);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) { res.status(404); throw new Error('Department not found'); }
  await department.deleteOne();
  res.json({ message: 'Department removed' });
});

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
