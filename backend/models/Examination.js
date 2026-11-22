const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Internal', 'Midterm', 'Final', 'Quiz', 'Practical'], default: 'Internal' },
    subject: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: { type: Number, default: 1 },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, default: 40 },
    room: { type: String, default: '' },
    status: { type: String, enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'], default: 'Scheduled' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Examination', examinationSchema);

