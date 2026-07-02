const searchService = require('../services/search.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/search/global?q=&limit=
 * Cross-entity search — returns max 5 results per entity
 */
const globalSearch = catchAsync(async (req, res) => {
  const { q, limit } = req.query;
  const result = await searchService.globalSearch(q, limit);
  res.status(200).json(new ApiResponse(200, 'Global search completed', result));
});

/**
 * GET /api/search/suggestions?q=&limit=
 * Autocomplete suggestions while typing
 */
const getSearchSuggestions = catchAsync(async (req, res) => {
  const { q, limit } = req.query;
  const suggestions = await searchService.getSearchSuggestions(q, limit);
  res.status(200).json(new ApiResponse(200, 'Suggestions fetched', suggestions));
});

/**
 * GET /api/search/students?q=&department=&year=&semester=&gender=&page=&limit=&sort=
 * Advanced server-side student search with filters and pagination
 */
const searchStudents = catchAsync(async (req, res) => {
  const result = await searchService.searchStudents(req.query);
  res.status(200).json(new ApiResponse(200, 'Student search completed', result));
});

/**
 * GET /api/search/faculty?q=&department=&designation=&page=&limit=&sort=
 * Advanced server-side faculty search with filters and pagination
 */
const searchFaculty = catchAsync(async (req, res) => {
  const result = await searchService.searchFaculty(req.query);
  res.status(200).json(new ApiResponse(200, 'Faculty search completed', result));
});

/**
 * GET /api/search/meta/students
 * Returns distinct filter values for the student search UI
 */
const getStudentFilterMeta = catchAsync(async (req, res) => {
  const meta = await searchService.getStudentFilterMeta();
  res.status(200).json(new ApiResponse(200, 'Student filter metadata retrieved', meta));
});

/**
 * GET /api/search/meta/faculty
 * Returns distinct filter values for the faculty search UI
 */
const getFacultyFilterMeta = catchAsync(async (req, res) => {
  const meta = await searchService.getFacultyFilterMeta();
  res.status(200).json(new ApiResponse(200, 'Faculty filter metadata retrieved', meta));
});

module.exports = {
  globalSearch,
  getSearchSuggestions,
  searchStudents,
  searchFaculty,
  getStudentFilterMeta,
  getFacultyFilterMeta,
};
