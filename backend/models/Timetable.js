const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: { type: Number, default: 1 },
    section: { type: String, default: 'A' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    subject: { type: String, default: '' },
    room: { type: String, default: '' },
    classroom: { type: String, default: '' },
    type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar'], default: 'Lecture' },
  },
  { timestamps: true }
);

timetableSchema.pre('save', function (next) {
  if (!this.room && this.classroom) this.room = this.classroom;
  if (!this.classroom && this.room) this.classroom = this.room;
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);

