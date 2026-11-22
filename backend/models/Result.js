const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, default: '' },
    semester: { type: Number },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: '' },
    passFail: { type: String, enum: ['Pass', 'Fail'], default: 'Fail' },
    status: { type: String, enum: ['Pass', 'Fail'], default: 'Fail' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

resultSchema.pre('save', function (next) {
  if (this.passFail && !this.status) this.status = this.passFail;
  if (this.status && !this.passFail) this.passFail = this.status;
  next();
});

module.exports = mongoose.model('Result', resultSchema);

