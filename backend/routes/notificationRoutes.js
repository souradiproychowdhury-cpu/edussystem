const express = require('express');
const { getNotifications, getAllNotificationsAdmin, createNotification, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/all', protect, authorize('admin'), getAllNotificationsAdmin);
router.post('/', protect, authorize('admin', 'teacher'), createNotification);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

module.exports = router;
