const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    date: { type: Date, default: Date.now },
    method: { type: String, default: 'Cash' },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    note: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    receiptNo: { type: String, default: '' },
  },
  { _id: false }
);

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    semester: { type: Number, default: 1 },
    academicYear: { type: String, default: '' },
    totalFees: { type: Number, required: true, default: 0 },
    totalCourseFees: { type: Number, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    paidFees: { type: Number, default: 0 },
    pendingFees: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial', 'Pending', 'Partially Paid'], default: 'Unpaid' },
    paymentHistory: [paymentSchema],
    dueDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

feeSchema.pre('validate', function (next) {
  // Sync aliases
  if (this.totalCourseFees && !this.totalFees) this.totalFees = this.totalCourseFees;
  if (this.totalFees && !this.totalCourseFees) this.totalCourseFees = this.totalFees;
  if (this.paidFees && !this.paidAmount) this.paidAmount = this.paidFees;
  if (this.paidAmount != null && !this.paidFees) this.paidFees = this.paidAmount;

  const total = Number(this.totalFees || 0);
  const paid = Number(this.paidAmount || 0);
  const pending = Math.max(total - paid, 0);
  this.pendingFees = pending;
  this.totalCourseFees = total;
  this.paidFees = paid;

  // Normalize status to frontend-friendly values while accepting legacy
  let status = this.paymentStatus;
  if (status === 'Pending') status = 'Unpaid';
  if (status === 'Partially Paid') status = 'Partial';
  if (paid <= 0) status = 'Unpaid';
  else if (pending <= 0) status = 'Paid';
  else status = 'Partial';
  this.paymentStatus = status;

  // Normalize payment history aliases
  this.paymentHistory = (this.paymentHistory || []).map((p) => ({
    ...p.toObject ? p.toObject() : p,
    paidAt: p.paidAt || p.date || new Date(),
    date: p.date || p.paidAt || new Date(),
    notes: p.notes || p.note || '',
    note: p.note || p.notes || '',
    receiptNumber: p.receiptNumber || p.receiptNo || '',
    receiptNo: p.receiptNo || p.receiptNumber || '',
    reference: p.reference || '',
  }));
  next();
});

module.exports = mongoose.model('Fee', feeSchema);

