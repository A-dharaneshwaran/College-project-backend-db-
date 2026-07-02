const queryService = require('../services/query.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const createQuery = catchAsync(async (req, res) => {
  const query = await queryService.createQuery(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Query raised successfully', query));
});

const getQueries = catchAsync(async (req, res) => {
  const result = await queryService.queryTickets(req.query);
  res.status(200).json(new ApiResponse(200, 'Queries retrieved successfully', result));
});

const getMyQueries = catchAsync(async (req, res) => {
  const queries = await queryService.getStudentTickets(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Your queries retrieved successfully', queries));
});

const respondQuery = catchAsync(async (req, res) => {
  const query = await queryService.respondToTicket(req.params.id, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Query response updated successfully', query));
});

module.exports = {
  createQuery,
  getQueries,
  getMyQueries,
  respondQuery
};
