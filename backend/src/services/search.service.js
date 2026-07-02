const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper: build a safe case-insensitive regex from user input
// ─────────────────────────────────────────────────────────────────────────────
const buildRegex = (str) =>
  new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper: build pagination meta
// ─────────────────────────────────────────────────────────────────────────────
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper: normalise sort string for Mongoose
// ─────────────────────────────────────────────────────────────────────────────
const buildSort = (sortParam, defaultSort = '-createdAt') => {
  if (!sortParam) return defaultSort;
  // accept "name", "-name", "year,-createdAt", etc.
  return sortParam;
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper: resolve User IDs that match a query string (name/email)
// Returns array of matching User _ids
// ─────────────────────────────────────────────────────────────────────────────
const resolveUserIds = async (q) => {
  const regex = buildRegex(q);
  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select('_id')
    .lean();
  return users.map((u) => u._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Priority-based Student filter builder
// Priority 1: exact register number
// Priority 2: name / email match via User lookup
// Priority 3: partial register number match
// ─────────────────────────────────────────────────────────────────────────────
const buildStudentSearchFilter = async (q, extraFilters = {}) => {
  const filter = { ...extraFilters };
  if (!q || !q.trim()) return filter;

  const trimmed = q.trim();
  const regex = buildRegex(trimmed);

  // Attempt exact register-number match first
  const exactByRegNo = await Student.findOne({ registerNumber: trimmed.toUpperCase() }).lean();
  if (exactByRegNo) {
    return { ...filter, _id: exactByRegNo._id };
  }

  // Resolve matching user IDs (name / email)
  const userIds = await resolveUserIds(trimmed);

  const orClauses = [
    { registerNumber: regex },
  ];
  if (userIds.length > 0) {
    orClauses.push({ user: { $in: userIds } });
  }

  filter.$or = orClauses;
  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// Priority-based Faculty filter builder
// ─────────────────────────────────────────────────────────────────────────────
const buildFacultySearchFilter = async (q, extraFilters = {}) => {
  const filter = { ...extraFilters };
  if (!q || !q.trim()) return filter;

  const trimmed = q.trim();
  const regex = buildRegex(trimmed);

  // Attempt exact employee-id match
  const exactByEmpId = await Faculty.findOne({ employeeId: trimmed.toUpperCase() }).lean();
  if (exactByEmpId) {
    return { ...filter, _id: exactByEmpId._id };
  }

  // Resolve user name / email matches
  const userIds = await resolveUserIds(trimmed);

  const orClauses = [
    { employeeId: regex },
    { designation: regex },
  ];
  if (userIds.length > 0) {
    orClauses.push({ user: { $in: userIds } });
  }

  filter.$or = orClauses;
  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// Department search filter builder
// ─────────────────────────────────────────────────────────────────────────────
const buildDepartmentSearchFilter = (q) => {
  if (!q || !q.trim()) return {};
  const regex = buildRegex(q.trim());
  return {
    $or: [{ name: regex }, { code: regex }, { description: regex }],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Subject search filter builder
// ─────────────────────────────────────────────────────────────────────────────
const buildSubjectSearchFilter = (q) => {
  if (!q || !q.trim()) return {};
  const regex = buildRegex(q.trim());
  return { $or: [{ name: regex }, { code: regex }] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Activity log search filter builder
// ─────────────────────────────────────────────────────────────────────────────
const buildActivitySearchFilter = (q) => {
  if (!q || !q.trim()) return {};
  const regex = buildRegex(q.trim());
  return { $or: [{ description: regex }, { action: regex }, { module: regex }] };
};

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ─────────────────────────────────────────────────────────────────────────────
// Message & Conversation search filter builders
// ─────────────────────────────────────────────────────────────────────────────
const buildMessageSearchFilter = (q) => {
  if (!q || !q.trim()) return {};
  const regex = buildRegex(q.trim());
  return {
    isDeleted: false,
    $or: [{ content: regex }, { attachments: regex }]
  };
};

const buildConversationSearchFilter = (q) => {
  if (!q || !q.trim()) return {};
  const regex = buildRegex(q.trim());
  return {
    isDeleted: false,
    name: regex
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL SEARCH
// Searches all collections in parallel — max 5 items each
// ─────────────────────────────────────────────────────────────────────────────
const globalSearch = async (q, limit = 5) => {
  if (!q || !q.trim()) {
    return { students: [], faculty: [], departments: [], subjects: [], activities: [], messages: [], conversations: [] };
  }

  const safeLimit = Math.min(parseInt(limit, 10) || 5, 10);

  const [studentFilter, facultyFilter] = await Promise.all([
    buildStudentSearchFilter(q),
    buildFacultySearchFilter(q),
  ]);

  const deptFilter = buildDepartmentSearchFilter(q);
  const subjectFilter = buildSubjectSearchFilter(q);
  const activityFilter = buildActivitySearchFilter(q);
  const messageFilter = buildMessageSearchFilter(q);
  const conversationFilter = buildConversationSearchFilter(q);

  const [students, faculty, departments, subjects, activities, messages, conversations] = await Promise.all([
    Student.find(studentFilter)
      .populate({ path: 'user', select: 'name email profilePhoto' })
      .populate({ path: 'department', select: 'name code' })
      .limit(safeLimit)
      .lean(),

    Faculty.find(facultyFilter)
      .populate({ path: 'user', select: 'name email profilePhoto' })
      .populate({ path: 'department', select: 'name code' })
      .limit(safeLimit)
      .lean(),

    Department.find(deptFilter)
      .populate({ path: 'hod', populate: { path: 'user', select: 'name' } })
      .limit(safeLimit)
      .lean(),

    Subject.find(subjectFilter)
      .populate({ path: 'department', select: 'name code' })
      .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } })
      .limit(safeLimit)
      .lean(),

    ActivityLog.find(activityFilter)
      .populate({ path: 'adminUser', select: 'name email' })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean(),

    Message.find(messageFilter)
      .populate({ path: 'sender', select: 'name email' })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean(),

    Conversation.find(conversationFilter)
      .limit(safeLimit)
      .lean(),
  ]);

  return { students, faculty, departments, subjects, activities, messages, conversations };
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH SUGGESTIONS
// Returns lightweight suggestion list for autocomplete (names only)
// ─────────────────────────────────────────────────────────────────────────────
const getSearchSuggestions = async (q, limit = 8) => {
  if (!q || !q.trim() || q.trim().length < 2) return [];

  const regex = buildRegex(q.trim());
  const safeLimit = Math.min(parseInt(limit, 10) || 8, 15);

  const [users, departments, subjects] = await Promise.all([
    User.find({ name: regex, isActive: true })
      .select('name role')
      .limit(safeLimit)
      .lean(),
    Department.find({ $or: [{ name: regex }, { code: regex }] })
      .select('name code')
      .limit(3)
      .lean(),
    Subject.find({ $or: [{ name: regex }, { code: regex }] })
      .select('name code')
      .limit(3)
      .lean(),
  ]);

  const suggestions = [];

  users.forEach((u) =>
    suggestions.push({ text: u.name, type: u.role, _id: u._id })
  );
  departments.forEach((d) =>
    suggestions.push({ text: d.name, subtitle: d.code, type: 'department', _id: d._id })
  );
  subjects.forEach((s) =>
    suggestions.push({ text: s.name, subtitle: s.code, type: 'subject', _id: s._id })
  );

  // Deduplicate by text and return the top N
  const seen = new Set();
  return suggestions
    .filter((s) => {
      if (seen.has(s.text)) return false;
      seen.add(s.text);
      return true;
    })
    .slice(0, safeLimit);
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ADVANCED SEARCH
// ─────────────────────────────────────────────────────────────────────────────
const searchStudents = async (queryParams) => {
  const {
    q,
    department,
    year,
    semester,
    gender,
    page: rawPage = 1,
    limit: rawLimit = 20,
    sort,
  } = queryParams;

  const page = Math.max(parseInt(rawPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const sortQuery = buildSort(sort, '-createdAt');

  // Build extra (non-text) filters
  const extraFilters = {};
  if (department && mongoose.Types.ObjectId.isValid(department)) {
    extraFilters.department = new mongoose.Types.ObjectId(department);
  }
  if (year) extraFilters.year = parseInt(year, 10);
  if (semester) extraFilters.semester = parseInt(semester, 10);
  if (gender) extraFilters.gender = gender;

  const filter = await buildStudentSearchFilter(q, extraFilters);

  const [data, total] = await Promise.all([
    Student.find(filter)
      .populate({ path: 'user', select: '-password' })
      .populate({ path: 'department', select: 'name code' })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return { data, pagination: buildPagination(page, limit, total) };
};

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY ADVANCED SEARCH
// ─────────────────────────────────────────────────────────────────────────────
const searchFaculty = async (queryParams) => {
  const {
    q,
    department,
    designation,
    page: rawPage = 1,
    limit: rawLimit = 20,
    sort,
  } = queryParams;

  const page = Math.max(parseInt(rawPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const sortQuery = buildSort(sort, '-createdAt');

  const extraFilters = {};
  if (department && mongoose.Types.ObjectId.isValid(department)) {
    extraFilters.department = new mongoose.Types.ObjectId(department);
  }
  if (designation) {
    extraFilters.designation = buildRegex(designation);
  }

  const filter = await buildFacultySearchFilter(q, extraFilters);

  const [data, total] = await Promise.all([
    Faculty.find(filter)
      .populate({ path: 'user', select: '-password' })
      .populate({ path: 'department', select: 'name code' })
      .populate({ path: 'subjects', select: 'name code' })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean(),
    Faculty.countDocuments(filter),
  ]);

  return { data, pagination: buildPagination(page, limit, total) };
};

// ─────────────────────────────────────────────────────────────────────────────
// DISTINCT FILTER VALUES — for dynamic dropdowns
// ─────────────────────────────────────────────────────────────────────────────
const getStudentFilterMeta = async () => {
  const [years, semesters, genders] = await Promise.all([
    Student.distinct('year'),
    Student.distinct('semester'),
    Student.distinct('gender'),
  ]);
  return {
    years: years.sort((a, b) => a - b),
    semesters: semesters.sort((a, b) => a - b),
    genders: genders.filter(Boolean),
  };
};

const getFacultyFilterMeta = async () => {
  const designations = await Faculty.distinct('designation');
  return { designations: designations.filter(Boolean).sort() };
};

module.exports = {
  globalSearch,
  getSearchSuggestions,
  searchStudents,
  searchFaculty,
  getStudentFilterMeta,
  getFacultyFilterMeta,
  // Export helpers for potential re-use
  buildRegex,
  buildPagination,
  buildSort,
};
