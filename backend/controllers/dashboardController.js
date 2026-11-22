const asyncHandler = require('../utils/asyncHandler');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Examination = require('../models/Examination');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const Result = require('../models/Result');

const getDashboardStats = asyncHandler(async (req, res) => {
  const role = req.user?.role;

  const unpaidStatuses = ['Unpaid', 'Partial', 'Pending', 'Partially Paid'];

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    totalDepartments,
    totalExaminations,
    attendanceTotal,
    pendingFeesAgg,
    departmentDistribution,
    monthlyRegistrations,
    attendanceOverview,
    recentStudents,
    upcomingExams,
    recentNotifications,
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Course.countDocuments(),
    Department.countDocuments(),
    Examination.countDocuments(),
    Attendance.countDocuments(),
    Fee.aggregate([
      { $group: { _id: null, pendingCount: { $sum: { $cond: [{ $in: ['$paymentStatus', unpaidStatuses] }, 1, 0] } }, pendingAmount: { $sum: '$pendingFees' } } },
    ]),
    Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: { year: { $year: '$enrollmentDate' }, month: { $month: '$enrollmentDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Student.find().sort({ createdAt: -1 }).limit(5).populate('department', 'name').select('studentId fullName email createdAt department academicStatus'),
    Examination.find({}).sort({ date: -1 }).limit(5).populate('department', 'name code').populate('course', 'name code'),
    Notification.find({
      $or: [
        { audience: 'all' },
        { audience: 'role', targetRole: role || 'admin' },
        { audience: role || 'admin' },
        ...(req.user?._id ? [{ recipient: req.user._id }] : []),
      ],
    }).sort({ createdAt: -1 }).limit(8).populate('createdBy', 'name role'),
  ]);

  const pending = pendingFeesAgg[0] || { pendingCount: 0, pendingAmount: 0 };
  const attendanceCounts = { Present: 0, Absent: 0, Late: 0 };
  attendanceOverview.forEach((a) => { attendanceCounts[a._id] = a.count; });

  let personal = {};
  if (role === 'student' && req.user.student) {
    const [myAttendance, myResults, myFee, myNotifs] = await Promise.all([
      Attendance.find({ student: req.user.student }),
      Result.find({ student: req.user.student }).sort({ createdAt: -1 }).limit(5).populate('examination', 'name subject date'),
      Fee.findOne({ student: req.user.student }),
      Notification.countDocuments({ $or: [{ audience: 'all' }, { audience: 'role', targetRole: 'student' }, { audience: 'student' }, { recipient: req.user._id }], readBy: { $ne: req.user._id } }),
    ]);
    const total = myAttendance.length;
    const presentLike = myAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    personal = {
      attendancePercentage: total ? Number(((presentLike / total) * 100).toFixed(1)) : 0,
      attendanceRecords: myAttendance.length,
      recentResults: myResults,
      fee: myFee,
      unreadNotifications: myNotifs,
    };
  }
  if (role === 'teacher' && req.user.teacher) {
    const [myTimetable, myNotifs] = await Promise.all([
      Timetable.countDocuments({ teacher: req.user.teacher }),
      Notification.countDocuments({ $or: [{ audience: 'all' }, { audience: 'role', targetRole: 'teacher' }, { audience: 'teacher' }, { recipient: req.user._id }], readBy: { $ne: req.user._id } }),
    ]);
    personal = { timetableSlots: myTimetable, unreadNotifications: myNotifs };
  }

  res.json({
    stats: {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalDepartments,
      totalExaminations,
      totalAttendance: attendanceTotal,
      pendingFees: pending.pendingCount,
      pendingFeeAmount: pending.pendingAmount || 0,
    },
    charts: {
      enrollmentByDepartment: departmentDistribution,
      attendanceOverview: [
        { name: 'Present', value: attendanceCounts.Present || 0 },
        { name: 'Absent', value: attendanceCounts.Absent || 0 },
        { name: 'Late', value: attendanceCounts.Late || 0 },
      ],
      monthlyRegistrations: monthlyRegistrations.map((m) => ({
        label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        count: m.count,
      })),
    },
    recent: {
      students: recentStudents,
      examinations: upcomingExams,
      notifications: recentNotifications,
    },
    personal,
  });
});

module.exports = { getDashboardStats };
