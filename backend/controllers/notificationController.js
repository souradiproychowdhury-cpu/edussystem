const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

const isForUser = (n, user) => {
  if (n.recipient && String(n.recipient) === String(user._id)) return true;
  if (n.audience === 'all') return true;
  if (n.audience === 'role') return n.targetRole === user.role;
  // legacy values 'admin'|'teacher'|'student'
  return n.audience === user.role;
};

const getNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  const base = {
    $or: [
      { audience: 'all' },
      { audience: 'role', targetRole: user.role },
      { audience: user.role },
      { recipient: user._id },
    ],
  };
  const notifications = await Notification.find(base)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(200);
  const mapped = notifications
    .filter((n) => (user.role === 'admin' ? true : n.isActive !== false))
    .map((n) => {
      const obj = n.toObject();
      const read = (n.readBy || []).some((id) => String(id) === String(user._id));
      return { ...obj, isRead: read, read };
    });
  res.json(mapped);
});

const getAllNotificationsAdmin = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate('createdBy', 'name role').populate('recipient', 'name email role').sort({ createdAt: -1 });
  res.json(notifications);
});

const createNotification = asyncHandler(async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) { res.status(400); throw new Error('Title and message are required'); }
  const payload = { ...req.body, createdBy: req.user?._id };
  if (payload.audience === 'role' && payload.targetRole && !['admin','teacher','student'].includes(payload.targetRole)) {
    res.status(400); throw new Error('Invalid target role');
  }
  if (payload.audience !== 'role') payload.targetRole = '';
  const notification = await Notification.create(payload);
  res.status(201).json(notification);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) { res.status(404); throw new Error('Notification not found'); }
  const userId = req.user._id;
  if (!isForUser(notification, req.user) && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized'); }
  if (!(notification.readBy || []).some((id) => String(id) === String(userId))) {
    notification.readBy = [...(notification.readBy || []), userId];
    await notification.save();
  }
  res.json({ message: 'Notification marked as read' });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const user = req.user;
  const notifications = await Notification.find({
    $or: [
      { audience: 'all' },
      { audience: 'role', targetRole: user.role },
      { audience: user.role },
      { recipient: user._id },
    ],
  });
  await Promise.all(notifications.map((n) => {
    if (!(n.readBy || []).some((id) => String(id) === String(user._id))) {
      n.readBy = [...(n.readBy || []), user._id];
      return n.save();
    }
    return null;
  }));
  res.json({ message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) { res.status(404); throw new Error('Notification not found'); }
  await notification.deleteOne();
  res.json({ message: 'Notification removed' });
});

module.exports = { getNotifications, getAllNotificationsAdmin, createNotification, markAsRead, markAllAsRead, deleteNotification };
