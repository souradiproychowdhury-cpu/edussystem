const asyncHandler = require('../utils/asyncHandler');
const Fee = require('../models/Fee');

const normalizeStatusQuery = (status) => {
  if (!status) return null;
  if (status === 'Unpaid') return { $in: ['Unpaid', 'Pending'] };
  if (status === 'Partial') return { $in: ['Partial', 'Partially Paid'] };
  return status;
};

const getFees = asyncHandler(async (req, res) => {
  const { status, unpaid, studentId, student } = req.query;
  const filter = {};
  if (studentId || student) filter.student = studentId || student;
  if (status) filter.paymentStatus = normalizeStatusQuery(status);
  if (unpaid === 'true') filter.paymentStatus = { $in: ['Unpaid', 'Pending', 'Partial', 'Partially Paid'] };

  if (req.user?.role === 'student' && req.user.student) {
    filter.student = req.user.student;
  }

  const fees = await Fee.find(filter)
    .populate({
      path: 'student',
      select: 'studentId fullName email department semester course',
      populate: [{ path: 'department', select: 'name code' }, { path: 'course', select: 'name code' }],
    })
    .sort({ updatedAt: -1 });
  res.json(fees);
});

const getFeeById = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id).populate({
    path: 'student',
    select: 'studentId fullName email department semester course guardianName guardianContact',
    populate: [{ path: 'department', select: 'name code' }, { path: 'course', select: 'name code' }],
  });
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  res.json(fee);
});

const createFee = asyncHandler(async (req, res) => {
  const student = req.body.student;
  const totalFees = req.body.totalFees ?? req.body.totalCourseFees;
  if (!student || totalFees == null) {
    res.status(400);
    throw new Error('Student and total fees are required');
  }
  const existing = await Fee.findOne({ student });
  if (existing) { res.status(400); throw new Error('Fee record already exists for this student'); }
  const fee = await Fee.create({
    ...req.body,
    totalFees: Number(totalFees),
    paidAmount: Number(req.body.paidAmount ?? req.body.paidFees ?? 0),
  });
  const populated = await Fee.findById(fee._id).populate({ path: 'student', select: 'studentId fullName email', populate: [{ path: 'department', select: 'name code' }] });
  res.status(201).json(populated);
});

const updateFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  const total = req.body.totalFees ?? req.body.totalCourseFees ?? fee.totalFees;
  const paid = req.body.paidAmount ?? req.body.paidFees ?? fee.paidAmount;
  Object.assign(fee, req.body, { totalFees: Number(total), paidAmount: Number(paid) });
  // If admin explicitly sets a status like Paid, keep it consistent by adjusting amounts
  if (req.body.paymentStatus === 'Paid' && Number(paid) < Number(total)) fee.paidAmount = Number(total);
  if (req.body.paymentStatus === 'Unpaid') fee.paidAmount = 0;
  await fee.save();
  const populated = await Fee.findById(fee._id).populate({ path: 'student', select: 'studentId fullName email', populate: [{ path: 'department', select: 'name code' }] });
  res.json(populated);
});

const addPayment = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) { res.status(400); throw new Error('Valid payment amount is required'); }
  const receiptNumber = req.body.receiptNumber || `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const payment = {
    amount,
    paidAt: new Date(),
    date: new Date(),
    method: req.body.method || 'Cash',
    reference: req.body.reference || '',
    notes: req.body.notes || req.body.note || '',
    note: req.body.note || req.body.notes || '',
    receiptNumber,
    receiptNo: receiptNumber,
  };
  fee.paymentHistory.push(payment);
  fee.paidAmount = Number(fee.paidAmount || 0) + amount;
  await fee.save();
  const populated = await Fee.findById(fee._id).populate({ path: 'student', select: 'studentId fullName email department semester course', populate: [{ path: 'department', select: 'name code' }, { path: 'course', select: 'name code' }] });
  res.json(populated);
});

const getReceipt = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id).populate({
    path: 'student',
    select: 'studentId fullName email department semester course',
    populate: [{ path: 'department', select: 'name code' }, { path: 'course', select: 'name code' }],
  });
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  const receiptNo = req.params.receiptNo;
  const payment = fee.paymentHistory.find((p) => p.receiptNumber === receiptNo || p.receiptNo === receiptNo);
  if (!payment) { res.status(404); throw new Error('Receipt not found'); }
  res.json({
    student: fee.student,
    fee: { _id: fee._id, semester: fee.semester, academicYear: fee.academicYear, totalFees: fee.totalFees, paidAmount: fee.paidAmount, pendingFees: fee.pendingFees, paymentStatus: fee.paymentStatus },
    receipt: { receiptNumber: payment.receiptNumber || payment.receiptNo, amount: payment.amount, paidAt: payment.paidAt || payment.date, method: payment.method, reference: payment.reference || '', notes: payment.notes || payment.note || '' },
  });
});

module.exports = { getFees, getFeeById, createFee, updateFee, addPayment, getReceipt };
