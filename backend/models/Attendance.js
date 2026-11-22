const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    semester: { type: Number },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1, course: 1 }, { unique: false });

module.exports = mongoose.model('Attendance', attendanceSchema);
