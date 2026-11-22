const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    mobile: { type: String, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    subjects: [{ type: String }],
    designation: { type: String, default: '' },
    qualification: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    specialization: { type: String, default: '' },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number },
    address: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    profilePhoto: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

teacherSchema.pre('save', function (next) {
  if (!this.mobile && this.phone) this.mobile = this.phone;
  if (!this.phone && this.mobile) this.phone = this.mobile;
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);

