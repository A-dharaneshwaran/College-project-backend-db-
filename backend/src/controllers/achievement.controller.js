const achievementService = require('../services/achievement.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const createAchievement = catchAsync(async (req, res) => {
  // req.user._id contains student user ID
  const achievement = await achievementService.createAchievement(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Achievement logged successfully', achievement));
});

const getAchievements = catchAsync(async (req, res) => {
  const result = await achievementService.queryAchievements(req.query);
  res.status(200).json(new ApiResponse(200, 'Achievements retrieved successfully', result));
});

const getMyAchievements = catchAsync(async (req, res) => {
  const achievements = await achievementService.getStudentAchievements(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Your achievements retrieved successfully', achievements));
});

const deleteAchievement = catchAsync(async (req, res) => {
  await achievementService.deleteAchievement(req.params.id, req.user._id, req.user.role);
  res.status(200).json(new ApiResponse(200, 'Achievement deleted successfully', null));
});

module.exports = {
  createAchievement,
  getAchievements,
  getMyAchievements,
  deleteAchievement
};
