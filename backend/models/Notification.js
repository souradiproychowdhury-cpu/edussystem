const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, default: 'Info' }, // Info, Alert, Announcement, Event, etc.
    audience: { type: String, default: 'all' }, // 'all' or 'role' or legacy role values
    targetRole: { type: String, enum: ['admin', 'teacher', 'student', ''], default: '' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

