const announcementService = require('../services/announcement.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

const createAnnouncement = catchAsync(async (req, res) => {
  const ann = await announcementService.createAnnouncement(req.user._id, req.body);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Announcement Published',
      module: 'Announcements',
      entityId: ann._id,
      entityType: 'Announcement',
      description: `Published announcement: ${ann.title}`,
      metadata: {
        title: ann.title,
        targetAudience: ann.targetAudience
      }
    });
  }

  res.status(201).json(new ApiResponse(201, 'Announcement posted successfully', ann));
});

const getAnnouncements = catchAsync(async (req, res) => {
  const result = await announcementService.queryAnnouncements(req.query);
  res.status(200).json(new ApiResponse(200, 'Announcements retrieved successfully', result));
});

const getMyAnnouncements = catchAsync(async (req, res) => {
  const announcements = await announcementService.getAnnouncementsForUser(req.user._id, req.user.role);
  res.status(200).json(new ApiResponse(200, 'Announcements retrieved successfully', announcements));
});

const deleteAnnouncement = catchAsync(async (req, res) => {
  await announcementService.deleteAnnouncement(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Announcement deleted successfully', null));
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getMyAnnouncements,
  deleteAnnouncement
};
