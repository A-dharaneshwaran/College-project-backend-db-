const Subject = require('../models/Subject');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');

/**
 * Create a new subject
 */
const createSubject = async (subjectData) => {
  const existingSub = await Subject.findOne({ code: subjectData.code.toUpperCase() });
  if (existingSub) {
    throw new ApiError(400, 'Subject code already exists');
  }
  return Subject.create(subjectData);
};

/**
 * Query subjects with search/pagination
 */
const querySubjects = async (query) => {
  return paginateQuery(Subject, query, {
    searchFields: ['name', 'code'],
    populate: ['department', 'faculty']
  });
};

/**
 * Get subject by ID
 */
const getSubjectById = async (id) => {
  const sub = await Subject.findById(id).populate('department').populate('faculty');
  if (!sub) {
    throw new ApiError(404, 'Subject not found');
  }
  return sub;
};

/**
 * Update subject by ID
 */
const updateSubject = async (id, updateBody) => {
  const sub = await Subject.findById(id);
  if (!sub) {
    throw new ApiError(404, 'Subject not found');
  }

  if (updateBody.code && updateBody.code.toUpperCase() !== sub.code) {
    const existingCode = await Subject.findOne({ code: updateBody.code.toUpperCase() });
    if (existingCode) {
      throw new ApiError(400, 'Subject code already in use');
    }
  }

  Object.assign(sub, updateBody);
  await sub.save();
  return getSubjectById(id);
};

/**
 * Delete subject by ID
 */
const deleteSubject = async (id) => {
  const sub = await Subject.findById(id);
  if (!sub) {
    throw new ApiError(404, 'Subject not found');
  }
  await sub.deleteOne();
  return sub;
};

module.exports = {
  createSubject,
  querySubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
};
