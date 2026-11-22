const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    profilePhoto: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    bloodGroup: { type: String, default: '' },
    address: { type: String, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    semester: { type: Number, default: 1 },
    batch: { type: String, default: '' },
    admissionYear: { type: Number },
    enrollmentDate: { type: Date, default: Date.now },
    guardianName: { type: String, default: '' },
    guardianContact: { type: String, default: '' },
    guardianRelation: { type: String, default: '' },
    academicStatus: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Graduated', 'Suspended'], default: 'Active' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.pre('save', function (next) {
  if (!this.mobile && this.phone) this.mobile = this.phone;
  if (!this.phone && this.mobile) this.phone = this.mobile;
  if (!this.admissionYear && this.enrollmentDate) this.admissionYear = new Date(this.enrollmentDate).getFullYear();
  next();
});

module.exports = mongoose.model('Student', studentSchema);

