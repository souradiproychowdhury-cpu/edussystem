const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    credits: { type: Number, default: 3 },
    semester: { type: Number, default: 1 },
    type: { type: String, enum: ['Core', 'Elective', 'Lab', 'Seminar'], default: 'Core' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);

