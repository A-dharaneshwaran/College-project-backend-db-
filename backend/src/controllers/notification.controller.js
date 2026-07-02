const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getMyNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, 'Notifications retrieved successfully', result));
});

const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Unread count retrieved successfully', { count }));
});

const markNotificationRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, 'Notification marked as read successfully', result));
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res.status(200).json(new ApiResponse(200, 'All notifications marked as read successfully', result));
});

const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, 'Notification deleted successfully', null));
});

const clearReadNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.clearReadNotifications(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Read notifications cleared successfully', result));
});

const testNotification = catchAsync(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json(new ApiResponse(403, 'Test endpoint disabled in production'));
  }
  const result = await notificationService.sendNotification(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Test notification sent', result));
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  testNotification
};
