/* Seed script for demo data */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Examination = require('../models/Examination');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');

dotenv.config();

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  await connectDB();
  console.log('Seeding database...');

  await Promise.all([
    Notification.deleteMany({}),
    Result.deleteMany({}),
    Examination.deleteMany({}),
    Attendance.deleteMany({}),
    Fee.deleteMany({}),
    Timetable.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Course.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({}),
  ]);

  const departments = await Department.insertMany([
    { name: 'Computer Science', code: 'CS', description: 'Computing, software and AI programs', headOfDepartment: null },
    { name: 'Electrical Engineering', code: 'EE', description: 'Power, electronics and embedded systems', headOfDepartment: null },
    { name: 'Business Administration', code: 'BA', description: 'Management, finance and marketing', headOfDepartment: null },
  ]);

  const admin = await User.create({
    name: 'System Administrator',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@edupulse.edu').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  });

  const teachers = await Teacher.insertMany([
    { teacherId: 'TCH-001', fullName: 'Dr. Eleanor Vance', email: (process.env.SEED_TEACHER_EMAIL || 'teacher@edupulse.edu').toLowerCase(), phone: '555-0101', mobile: '555-0101', department: departments[0]._id, subjects: ['Data Structures', 'Algorithms'], designation: 'Associate Professor', qualification: 'PhD Computer Science', experienceYears: 8, specialization: 'Algorithms & Data Systems', joiningDate: new Date('2021-08-15'), address: '45 Campus Drive, North Hall', status: 'Active' },
    { teacherId: 'TCH-002', fullName: 'Prof. Marcus Lee', email: 'marcus.lee@edupulse.edu', phone: '555-0102', mobile: '555-0102', department: departments[1]._id, subjects: ['Circuits', 'Signals'], designation: 'Professor', qualification: 'MSc Electrical Engineering', experienceYears: 12, specialization: 'Embedded Systems', joiningDate: new Date('2020-02-10'), address: '12 Engineering Block', status: 'Active' },
    { teacherId: 'TCH-003', fullName: 'Dr. Anita Sharma', email: 'anita.sharma@edupulse.edu', phone: '555-0103', mobile: '555-0103', department: departments[2]._id, subjects: ['Marketing', 'Finance'], designation: 'Assistant Professor', qualification: 'MBA, PhD', experienceYears: 6, specialization: 'Business Strategy', joiningDate: new Date('2019-06-01'), address: '88 Business Avenue', status: 'Active' },
  ]);

  departments[0].headOfDepartment = teachers[0]._id;
  departments[1].headOfDepartment = teachers[1]._id;
  departments[2].headOfDepartment = teachers[2]._id;
  await Promise.all(departments.map((d) => d.save()));

  const teacherUser = await User.create({
    name: teachers[0].fullName,
    email: teachers[0].email,
    password: process.env.SEED_TEACHER_PASSWORD || 'Teacher@123',
    role: 'teacher',
    teacher: teachers[0]._id,
  });
  teachers[0].user = teacherUser._id;
  await teachers[0].save();

  const courses = await Course.insertMany([
    { name: 'Data Structures', code: 'CS201', department: departments[0]._id, teacher: teachers[0]._id, credits: 4, semester: 3, type: 'Core', description: 'Core data structures and complexity', isActive: true },
    { name: 'Algorithms', code: 'CS301', department: departments[0]._id, teacher: teachers[0]._id, credits: 4, semester: 5, type: 'Core', description: 'Algorithm design and analysis', isActive: true },
    { name: 'Digital Circuits', code: 'EE210', department: departments[1]._id, teacher: teachers[1]._id, credits: 3, semester: 2, type: 'Core', description: 'Logic design and circuits', isActive: true },
    { name: 'Business Finance', code: 'BA220', department: departments[2]._id, teacher: teachers[2]._id, credits: 3, semester: 4, type: 'Elective', description: 'Financial management fundamentals', isActive: true },
  ]);

  const studentDefs = [
    { studentId: 'STU-2024-001', fullName: 'Aiden Carter', email: (process.env.SEED_STUDENT_EMAIL || 'student@edupulse.edu').toLowerCase(), phone: '555-1001', mobile: '555-1001', gender: 'Male', bloodGroup: 'O+', address: '21 Maple Street', department: departments[0]._id, course: courses[0]._id, semester: 3, batch: '2024-2028', admissionYear: 2024, guardianName: 'Laura Carter', guardianContact: '555-2001', guardianRelation: 'Mother', academicStatus: 'Active', enrollmentDate: new Date('2024-01-10') },
    { studentId: 'STU-2024-002', fullName: 'Maya Patel', email: 'maya.patel@edupulse.edu', phone: '555-1002', mobile: '555-1002', gender: 'Female', bloodGroup: 'A+', address: '9 River Road', department: departments[0]._id, course: courses[1]._id, semester: 5, batch: '2023-2027', admissionYear: 2023, guardianName: 'Ravi Patel', guardianContact: '555-2002', guardianRelation: 'Father', academicStatus: 'Active', enrollmentDate: new Date('2023-08-12') },
    { studentId: 'STU-2024-003', fullName: 'Liam Johnson', email: 'liam.johnson@edupulse.edu', phone: '555-1003', mobile: '555-1003', gender: 'Male', bloodGroup: 'B+', address: '77 Oak Avenue', department: departments[1]._id, course: courses[2]._id, semester: 2, batch: '2024-2028', admissionYear: 2024, guardianName: 'Noah Johnson', guardianContact: '555-2003', guardianRelation: 'Father', academicStatus: 'Active', enrollmentDate: new Date('2024-02-05') },
    { studentId: 'STU-2024-004', fullName: 'Sophia Nguyen', email: 'sophia.nguyen@edupulse.edu', phone: '555-1004', mobile: '555-1004', gender: 'Female', bloodGroup: 'AB+', address: '5 Lake View', department: departments[2]._id, course: courses[3]._id, semester: 4, batch: '2023-2027', admissionYear: 2023, guardianName: 'Minh Nguyen', guardianContact: '555-2004', guardianRelation: 'Father', academicStatus: 'Active', enrollmentDate: new Date('2023-09-01') },
    { studentId: 'STU-2024-005', fullName: 'Ethan Brown', email: 'ethan.brown@edupulse.edu', phone: '555-1005', mobile: '555-1005', gender: 'Male', bloodGroup: 'O-', address: '18 Pine Street', department: departments[0]._id, course: courses[0]._id, semester: 3, batch: '2024-2028', admissionYear: 2024, guardianName: 'Olivia Brown', guardianContact: '555-2005', guardianRelation: 'Mother', academicStatus: 'On Leave', enrollmentDate: new Date('2024-03-15') },
    { studentId: 'STU-2023-006', fullName: 'Isabella Garcia', email: 'isabella.garcia@edupulse.edu', phone: '555-1006', mobile: '555-1006', gender: 'Female', bloodGroup: 'A-', address: '33 Hillcrest', department: departments[1]._id, course: courses[2]._id, semester: 2, batch: '2023-2027', admissionYear: 2023, guardianName: 'Carlos Garcia', guardianContact: '555-2006', guardianRelation: 'Father', academicStatus: 'Active', enrollmentDate: new Date('2023-07-20') },
  ];
  const students = await Student.insertMany(studentDefs);

  const studentUser = await User.create({
    name: students[0].fullName,
    email: students[0].email,
    password: process.env.SEED_STUDENT_PASSWORD || 'Student@123',
    role: 'student',
    student: students[0]._id,
  });
  students[0].user = studentUser._id;
  await students[0].save();

  // Fees
  const feeDocs = students.map((s, idx) => {
    const total = 50000 + idx * 5000;
    const paid = idx % 3 === 0 ? total : idx % 3 === 1 ? Math.floor(total * 0.5) : 0;
    const pending = total - paid;
    const status = paid <= 0 ? 'Unpaid' : pending <= 0 ? 'Paid' : 'Partial';
    const history = [];
    if (paid > 0) {
      history.push({ amount: paid, paidAt: new Date(Date.now() - (idx + 2) * 86400000), date: new Date(Date.now() - (idx + 2) * 86400000), method: idx % 2 ? 'Bank Transfer' : 'Cash', reference: `TXN-SEED-${1000 + idx}`, notes: 'Tuition payment', note: 'Tuition payment', receiptNumber: `RCPT-SEED-${1000 + idx}`, receiptNo: `RCPT-SEED-${1000 + idx}` });
    }
    return { student: s._id, semester: s.semester, academicYear: '2025-2026', totalFees: total, totalCourseFees: total, paidAmount: paid, paidFees: paid, pendingFees: pending, paymentStatus: status, paymentHistory: history };
  });
  await Fee.insertMany(feeDocs);

  const exams = await Examination.insertMany([
    { name: 'Midterm Exam', type: 'Midterm', subject: 'Data Structures', course: courses[0]._id, department: departments[0]._id, semester: 3, date: new Date(Date.now() + 7 * 86400000), startTime: '09:00', endTime: '11:00', totalMarks: 100, passingMarks: 40, room: 'CS-101', status: 'Scheduled' },
    { name: 'Quiz 1', type: 'Quiz', subject: 'Algorithms', course: courses[1]._id, department: departments[0]._id, semester: 5, date: new Date(Date.now() - 10 * 86400000), startTime: '10:00', endTime: '11:00', totalMarks: 50, passingMarks: 20, room: 'CS-203', status: 'Completed' },
    { name: 'Final Exam', type: 'Final', subject: 'Digital Circuits', course: courses[2]._id, department: departments[1]._id, semester: 2, date: new Date(Date.now() + 20 * 86400000), startTime: '13:00', endTime: '16:00', totalMarks: 100, passingMarks: 40, room: 'EE-105', status: 'Scheduled' },
  ]);

  const gradeFor = (pct) => pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
  const resultDocs = [];
  for (const s of students) {
    for (const ex of exams) {
      if (String(s.department) !== String(ex.department)) continue;
      const obtained = Math.floor(40 + Math.random() * (ex.totalMarks - 30));
      const pct = Number(((obtained / ex.totalMarks) * 100).toFixed(2));
      const passFail = obtained >= (ex.passingMarks || 40) ? 'Pass' : 'Fail';
      resultDocs.push({
        examination: ex._id,
        student: s._id,
        subject: ex.subject,
        semester: ex.semester,
        marksObtained: obtained,
        totalMarks: ex.totalMarks,
        percentage: pct,
        grade: gradeFor(pct),
        passFail,
        status: passFail,
      });
    }
  }
  if (resultDocs.length) await Result.insertMany(resultDocs);

  const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent'];
  const attDocs = [];
  for (let d = 0; d < 20; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(9, 0, 0, 0);
    for (const s of students) {
      attDocs.push({
        student: s._id,
        department: s.department,
        course: s.course,
        semester: s.semester,
        date,
        status: rand(statuses),
        markedBy: teacherUser._id,
      });
    }
  }
  await Attendance.insertMany(attDocs);

  await Timetable.insertMany([
    { day: 'Monday', startTime: '09:00', endTime: '10:30', department: departments[0]._id, semester: 3, section: 'A', course: courses[0]._id, teacher: teachers[0]._id, subject: 'Data Structures', room: 'CS-101', classroom: 'CS-101', type: 'Lecture' },
    { day: 'Tuesday', startTime: '11:00', endTime: '12:30', department: departments[0]._id, semester: 5, section: 'A', course: courses[1]._id, teacher: teachers[0]._id, subject: 'Algorithms', room: 'CS-203', classroom: 'CS-203', type: 'Lecture' },
    { day: 'Wednesday', startTime: '10:00', endTime: '11:30', department: departments[1]._id, semester: 2, section: 'A', course: courses[2]._id, teacher: teachers[1]._id, subject: 'Digital Circuits', room: 'EE-105', classroom: 'EE-105', type: 'Lecture' },
    { day: 'Thursday', startTime: '13:00', endTime: '14:30', department: departments[2]._id, semester: 4, section: 'A', course: courses[3]._id, teacher: teachers[2]._id, subject: 'Business Finance', room: 'BA-301', classroom: 'BA-301', type: 'Lecture' },
    { day: 'Friday', startTime: '09:00', endTime: '10:30', department: departments[0]._id, semester: 3, section: 'A', course: courses[0]._id, teacher: teachers[0]._id, subject: 'Data Structures Lab', room: 'Lab-2', classroom: 'Lab-2', type: 'Lab' },
  ]);

  await Notification.insertMany([
    { title: 'Welcome to EduPulse SMS', message: 'The new academic term has started. Check your dashboard for updates.', audience: 'all', targetRole: '', type: 'Announcement', isActive: true, createdBy: admin._id },
    { title: 'Midterm Examination Scheduled', message: 'Data Structures midterm exam is scheduled next week. Prepare accordingly.', audience: 'role', targetRole: 'student', type: 'Alert', isActive: true, createdBy: admin._id },
    { title: 'Attendance Reminder', message: 'Please ensure attendance is marked for all classes this week.', audience: 'role', targetRole: 'teacher', type: 'Info', isActive: true, createdBy: admin._id },
    { title: 'Fee Payment Reminder', message: 'Pending tuition fees are due soon. Please clear dues to avoid holds.', audience: 'role', targetRole: 'student', type: 'Alert', isActive: true, createdBy: admin._id },
  ]);

  console.log('Seed completed successfully.');
  console.log('Demo credentials:');
  console.log(`Admin:   ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@123'}`);
  console.log(`Teacher: ${teacherUser.email} / ${process.env.SEED_TEACHER_PASSWORD || 'Teacher@123'}`);
  console.log(`Student: ${studentUser.email} / ${process.env.SEED_STUDENT_PASSWORD || 'Student@123'}`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
