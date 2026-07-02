/**
 * Bulk Import Service
 * Handles parsing, validation, password generation, and batch DB insertion
 * for Student and Faculty bulk imports.
 */

const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ApiError = require('../utils/ApiError');

// ─── Password Generation ───────────────────────────────────────────────────

/**
 * Generate temporary password for student
 * e.g. "722821104001" → "KCE@104001" (last 6 chars)
 */
const generateStudentPassword = (registerNumber) => {
  const regStr = String(registerNumber).trim();
  const suffix = regStr.length > 6 ? regStr.slice(-6) : regStr;
  return `KCE@${suffix}`;
};

/**
 * Generate temporary password for faculty
 * e.g. "FAC00125" → "KCE@FAC00125"
 */
const generateFacultyPassword = (employeeId) => {
  return `KCE@${String(employeeId).trim().toUpperCase()}`;
};

// ─── File Parser ───────────────────────────────────────────────────────────

/**
 * Parse an xlsx or csv buffer into an array of plain row objects.
 * Returns { headers, rows } where each row is a plain JS object.
 */
const parseFile = (buffer, originalname) => {
  const ext = (originalname || '').split('.').pop().toLowerCase();

  let workbook;
  try {
    if (ext === 'csv') {
      workbook = xlsx.read(buffer, { type: 'buffer', raw: false });
    } else {
      workbook = xlsx.read(buffer, { type: 'buffer' });
    }
  } catch (e) {
    throw new ApiError(400, `Failed to parse file: ${e.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new ApiError(400, 'The uploaded file is empty or has no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows || rows.length === 0) {
    throw new ApiError(400, 'The spreadsheet contains no data rows.');
  }

  return rows;
};

// ─── Student Import ────────────────────────────────────────────────────────

/** Required student columns (case-insensitive trimmed keys) */
const STUDENT_COLUMN_MAP = {
  'register number': 'registerNumber',
  'full name': 'name',
  'email': 'email',
  'department code': 'departmentCode',
  'semester': 'semester',
  'year': 'year',
  'section': 'section',
  'phone number': 'phone',
  'father name': 'fatherName',
  'father phone': 'fatherPhone',
  'mother name': 'motherName',
  'mother phone': 'motherPhone',
  'gender': 'gender',
  'date of birth': 'dateOfBirth',
};

const EMAIL_REGEX = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
const VALID_GENDERS = new Set(['male', 'female', 'other']);
const VALID_SEMESTERS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
const VALID_YEARS = new Set([1, 2, 3, 4]);

/**
 * Normalize a raw xlsx row object into a student-shaped plain object.
 * Keys from the xlsx file may have varying cases — normalize them.
 */
const normalizeStudentRow = (raw) => {
  const norm = {};
  for (const [rawKey, rawVal] of Object.entries(raw)) {
    const mappedKey = STUDENT_COLUMN_MAP[String(rawKey).trim().toLowerCase()];
    if (mappedKey) norm[mappedKey] = String(rawVal ?? '').trim();
  }
  return norm;
};

/**
 * Validate and bulk import students.
 *
 * @param {Buffer} fileBuffer
 * @param {string} originalname
 * @param {string} mode  'create_only' | 'update_only' | 'create_update'
 * @param {boolean} previewOnly  If true, skip actual DB writes and return preview
 * @returns {Promise<Object>} import report
 */
const processStudentImport = async (fileBuffer, originalname, mode = 'create_only', previewOnly = false) => {
  const rawRows = parseFile(fileBuffer, originalname);

  // ── Load reference data into memory (O(1) lookups) ──────────────────────
  const allDepts = await Department.find({}, { code: 1, _id: 1 });
  const deptCodeMap = {};  // code → _id
  allDepts.forEach(d => { deptCodeMap[d.code.toUpperCase()] = d._id; });

  const existingStudents = await Student.find({}, { registerNumber: 1, user: 1 })
    .populate('user', 'email');
  const existingRegNos = new Map();  // registerNumber → { studentId, userId, email }
  const existingStudentEmails = new Set();
  existingStudents.forEach(s => {
    existingRegNos.set(s.registerNumber, { studentId: s._id, userId: s.user?._id, email: s.user?.email });
    if (s.user?.email) existingStudentEmails.add(s.user.email.toLowerCase());
  });

  const existingUsers = await User.find({}, { email: 1 });
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

  // ── Validate rows ────────────────────────────────────────────────────────
  const validRows = [];
  const invalidRows = [];
  const duplicateRows = [];   // existing records that will be updated
  const seenRegNos = new Set();
  const seenEmails = new Set();

  rawRows.forEach((raw, idx) => {
    const rowNum = idx + 2; // +2 because row 1 is header
    const row = normalizeStudentRow(raw);
    const errors = [];

    // Required fields
    if (!row.registerNumber) errors.push('Register Number is required');
    if (!row.name) errors.push('Full Name is required');
    if (!row.email) errors.push('Email is required');
    if (!row.departmentCode) errors.push('Department Code is required');
    if (!row.phone) errors.push('Phone Number is required');
    if (!row.fatherName) errors.push('Father Name is required');
    if (!row.fatherPhone) errors.push('Father Phone is required');
    if (!row.motherName) errors.push('Mother Name is required');
    if (!row.motherPhone) errors.push('Mother Phone is required');
    if (!row.gender) errors.push('Gender is required');

    // Email format
    if (row.email && !EMAIL_REGEX.test(row.email)) {
      errors.push(`Invalid email format: ${row.email}`);
    }

    // Gender
    if (row.gender && !VALID_GENDERS.has(row.gender.toLowerCase())) {
      errors.push(`Invalid gender: "${row.gender}". Must be Male, Female, or Other`);
    }

    // Semester
    const semNum = parseInt(row.semester, 10);
    if (!row.semester || isNaN(semNum) || !VALID_SEMESTERS.has(semNum)) {
      errors.push(`Invalid semester: "${row.semester}". Must be 1–8`);
    } else {
      row.semester = semNum;
    }

    // Year
    const yearNum = parseInt(row.year, 10);
    if (!row.year || isNaN(yearNum) || !VALID_YEARS.has(yearNum)) {
      errors.push(`Invalid year: "${row.year}". Must be 1–4`);
    } else {
      row.year = yearNum;
    }

    // Department
    const deptId = row.departmentCode ? deptCodeMap[row.departmentCode.toUpperCase()] : null;
    if (row.departmentCode && !deptId) {
      errors.push(`Department code not found: "${row.departmentCode}"`);
    } else if (deptId) {
      row.departmentId = deptId;
    }

    // Within-file duplicates
    if (row.registerNumber && seenRegNos.has(row.registerNumber.toUpperCase())) {
      errors.push(`Duplicate Register Number within file: ${row.registerNumber}`);
    } else if (row.registerNumber) {
      seenRegNos.add(row.registerNumber.toUpperCase());
    }

    if (row.email && seenEmails.has(row.email.toLowerCase())) {
      errors.push(`Duplicate Email within file: ${row.email}`);
    } else if (row.email) {
      seenEmails.add(row.email.toLowerCase());
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNum, row, errors });
      return;
    }

    // DB duplicate detection
    const regKey = row.registerNumber.toUpperCase();
    const emailKey = row.email.toLowerCase();
    const existingByReg = existingRegNos.get(regKey);
    const existingByEmail = existingEmails.has(emailKey);

    if (existingByReg || existingByEmail) {
      row.isExisting = true;
      row.existingStudentId = existingByReg?.studentId;
      row.existingUserId = existingByReg?.userId;
      duplicateRows.push({ rowNum, row, existingEmail: existingByReg?.email });
    } else {
      row.isExisting = false;
      validRows.push({ rowNum, row });
    }
  });

  // Determine what to process based on mode
  const toCreate = [];
  const toUpdate = [];

  validRows.forEach(r => toCreate.push(r));

  if (mode === 'update_only' || mode === 'create_update') {
    duplicateRows.forEach(r => toUpdate.push(r));
  }
  if (mode === 'create_only') {
    // duplicates are just skipped
  }

  if (previewOnly) {
    return {
      preview: true,
      total: rawRows.length,
      valid: validRows.length,
      duplicates: duplicateRows.length,
      invalid: invalidRows.length,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      invalidRows: invalidRows.slice(0, 50),   // cap for UI
      duplicateRows: duplicateRows.slice(0, 50),
    };
  }

  // ── Execute bulk import in a MongoDB transaction ─────────────────────────
  const session = await mongoose.startSession();
  const importedRecords = [];  // for password report
  const failedDuringInsert = [];
  let importedCount = 0;
  let updatedCount = 0;

  try {
    await session.withTransaction(async () => {
      // ── CREATE new students ──────────────────────────────────────────────
      if (toCreate.length > 0) {
        // Hash passwords in parallel
        const SALT_ROUNDS = 10;
        const salt = await bcrypt.genSalt(SALT_ROUNDS);

        const userDocs = [];
        const plainPasswords = [];

        for (const { row } of toCreate) {
          const plain = generateStudentPassword(row.registerNumber);
          const hashed = await bcrypt.hash(plain, salt);
          plainPasswords.push(plain);
          userDocs.push({
            name: row.name,
            email: row.email.toLowerCase(),
            password: hashed,
            role: 'student',
            isActive: true
          });
        }

        // insertMany with ordered:false continues past individual failures
        const createdUsers = await User.insertMany(userDocs, { session, ordered: false });

        const studentDocs = [];
        createdUsers.forEach((user, i) => {
          const { row } = toCreate[i];
          studentDocs.push({
            user: user._id,
            registerNumber: row.registerNumber.toUpperCase(),
            phone: row.phone,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date('2000-01-01'),
            gender: row.gender.charAt(0).toUpperCase() + row.gender.slice(1).toLowerCase(),
            department: row.departmentId,
            year: row.year,
            semester: row.semester,
            parentDetails: {
              fatherName: row.fatherName,
              fatherPhone: row.fatherPhone,
              motherName: row.motherName,
              motherPhone: row.motherPhone,
            },
          });
          importedRecords.push({
            name: row.name,
            email: row.email.toLowerCase(),
            registerNumber: row.registerNumber.toUpperCase(),
            temporaryPassword: plainPasswords[i],
          });
        });

        await Student.insertMany(studentDocs, { session, ordered: false });
        importedCount = createdUsers.length;
      }

      // ── UPDATE existing students ─────────────────────────────────────────
      if (toUpdate.length > 0) {
        for (const { row } of toUpdate) {
          if (!row.existingUserId) continue;
          await User.findByIdAndUpdate(
            row.existingUserId,
            { name: row.name },
            { session }
          );
          await Student.findByIdAndUpdate(
            row.existingStudentId,
            {
              phone: row.phone,
              department: row.departmentId,
              year: row.year,
              semester: row.semester,
              gender: row.gender.charAt(0).toUpperCase() + row.gender.slice(1).toLowerCase(),
              'parentDetails.fatherName': row.fatherName,
              'parentDetails.fatherPhone': row.fatherPhone,
              'parentDetails.motherName': row.motherName,
              'parentDetails.motherPhone': row.motherPhone,
            },
            { session }
          );
          updatedCount++;
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    preview: false,
    total: rawRows.length,
    importedCount,
    updatedCount,
    failedCount: invalidRows.length + failedDuringInsert.length,
    skippedCount: duplicateRows.length - toUpdate.length,
    invalidRows: invalidRows,
    importedRecords,   // for password report download
  };
};

// ─── Faculty Import ────────────────────────────────────────────────────────

const FACULTY_COLUMN_MAP = {
  'employee id': 'employeeId',
  'full name': 'name',
  'email': 'email',
  'department code': 'departmentCode',
  'designation': 'designation',
  'subjects': 'subjects',
  'experience': 'experience',
  'phone number': 'phone',
  'specialization': 'specialization',
};

const normalizeFacultyRow = (raw) => {
  const norm = {};
  for (const [rawKey, rawVal] of Object.entries(raw)) {
    const mappedKey = FACULTY_COLUMN_MAP[String(rawKey).trim().toLowerCase()];
    if (mappedKey) norm[mappedKey] = String(rawVal ?? '').trim();
  }
  return norm;
};

/**
 * Validate and bulk import faculty.
 */
const processFacultyImport = async (fileBuffer, originalname, mode = 'create_only', previewOnly = false) => {
  const rawRows = parseFile(fileBuffer, originalname);

  // Load reference data
  const allDepts = await Department.find({}, { code: 1, _id: 1 });
  const deptCodeMap = {};
  allDepts.forEach(d => { deptCodeMap[d.code.toUpperCase()] = d._id; });

  const allSubjects = await Subject.find({}, { name: 1, code: 1, _id: 1 });
  const subjectNameMap = {};
  allSubjects.forEach(s => {
    subjectNameMap[s.name.toLowerCase()] = s._id;
    if (s.code) subjectNameMap[s.code.toLowerCase()] = s._id;
  });

  const existingFaculty = await Faculty.find({}, { employeeId: 1, user: 1 })
    .populate('user', 'email');
  const existingEmpIds = new Map();
  const existingFacultyEmails = new Set();
  existingFaculty.forEach(f => {
    existingEmpIds.set(f.employeeId, { facultyId: f._id, userId: f.user?._id, email: f.user?.email });
    if (f.user?.email) existingFacultyEmails.add(f.user.email.toLowerCase());
  });

  const existingUsers = await User.find({}, { email: 1 });
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

  const validRows = [];
  const invalidRows = [];
  const duplicateRows = [];
  const seenEmpIds = new Set();
  const seenEmails = new Set();

  rawRows.forEach((raw, idx) => {
    const rowNum = idx + 2;
    const row = normalizeFacultyRow(raw);
    const errors = [];

    if (!row.employeeId) errors.push('Employee ID is required');
    if (!row.name) errors.push('Full Name is required');
    if (!row.email) errors.push('Email is required');
    if (!row.departmentCode) errors.push('Department Code is required');
    if (!row.designation) errors.push('Designation is required');
    if (!row.phone) errors.push('Phone Number is required');

    if (row.email && !EMAIL_REGEX.test(row.email)) {
      errors.push(`Invalid email format: ${row.email}`);
    }

    const deptId = row.departmentCode ? deptCodeMap[row.departmentCode.toUpperCase()] : null;
    if (row.departmentCode && !deptId) {
      errors.push(`Department code not found: "${row.departmentCode}"`);
    } else if (deptId) {
      row.departmentId = deptId;
    }

    // Resolve subject names/codes to IDs
    const subjectIds = [];
    if (row.subjects) {
      const subjectTokens = row.subjects.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
      subjectTokens.forEach(token => {
        const sid = subjectNameMap[token.toLowerCase()];
        if (sid) subjectIds.push(sid);
      });
    }
    row.subjectIds = subjectIds;

    if (row.employeeId && seenEmpIds.has(row.employeeId.toUpperCase())) {
      errors.push(`Duplicate Employee ID within file: ${row.employeeId}`);
    } else if (row.employeeId) {
      seenEmpIds.add(row.employeeId.toUpperCase());
    }

    if (row.email && seenEmails.has(row.email.toLowerCase())) {
      errors.push(`Duplicate Email within file: ${row.email}`);
    } else if (row.email) {
      seenEmails.add(row.email.toLowerCase());
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNum, row, errors });
      return;
    }

    const empKey = row.employeeId.toUpperCase();
    const emailKey = row.email.toLowerCase();
    const existingByEmp = existingEmpIds.get(empKey);
    const existingByEmail = existingEmails.has(emailKey);

    if (existingByEmp || existingByEmail) {
      row.isExisting = true;
      row.existingFacultyId = existingByEmp?.facultyId;
      row.existingUserId = existingByEmp?.userId;
      duplicateRows.push({ rowNum, row, existingEmail: existingByEmp?.email });
    } else {
      row.isExisting = false;
      validRows.push({ rowNum, row });
    }
  });

  const toCreate = [];
  const toUpdate = [];
  validRows.forEach(r => toCreate.push(r));
  if (mode === 'update_only' || mode === 'create_update') {
    duplicateRows.forEach(r => toUpdate.push(r));
  }

  if (previewOnly) {
    return {
      preview: true,
      total: rawRows.length,
      valid: validRows.length,
      duplicates: duplicateRows.length,
      invalid: invalidRows.length,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      invalidRows: invalidRows.slice(0, 50),
      duplicateRows: duplicateRows.slice(0, 50),
    };
  }

  const session = await mongoose.startSession();
  const importedRecords = [];
  let importedCount = 0;
  let updatedCount = 0;

  try {
    await session.withTransaction(async () => {
      if (toCreate.length > 0) {
        const salt = await bcrypt.genSalt(10);
        const userDocs = [];
        const plainPasswords = [];

        for (const { row } of toCreate) {
          const plain = generateFacultyPassword(row.employeeId);
          const hashed = await bcrypt.hash(plain, salt);
          plainPasswords.push(plain);
          userDocs.push({
            name: row.name,
            email: row.email.toLowerCase(),
            password: hashed,
            role: 'faculty',
            isActive: true,
          });
        }

        const createdUsers = await User.insertMany(userDocs, { session, ordered: false });

        const facultyDocs = [];
        createdUsers.forEach((user, i) => {
          const { row } = toCreate[i];
          facultyDocs.push({
            user: user._id,
            employeeId: row.employeeId.toUpperCase(),
            phone: row.phone,
            department: row.departmentId,
            designation: row.designation,
            specialization: row.specialization || '',
            subjects: row.subjectIds || [],
          });
          importedRecords.push({
            name: row.name,
            email: row.email.toLowerCase(),
            employeeId: row.employeeId.toUpperCase(),
            temporaryPassword: plainPasswords[i],
          });
        });

        await Faculty.insertMany(facultyDocs, { session, ordered: false });
        importedCount = createdUsers.length;
      }

      if (toUpdate.length > 0) {
        for (const { row } of toUpdate) {
          if (!row.existingUserId) continue;
          await User.findByIdAndUpdate(row.existingUserId, { name: row.name }, { session });
          await Faculty.findByIdAndUpdate(
            row.existingFacultyId,
            {
              phone: row.phone,
              department: row.departmentId,
              designation: row.designation,
              specialization: row.specialization || '',
              ...(row.subjectIds?.length > 0 && { subjects: row.subjectIds }),
            },
            { session }
          );
          updatedCount++;
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    preview: false,
    total: rawRows.length,
    importedCount,
    updatedCount,
    failedCount: invalidRows.length,
    skippedCount: duplicateRows.length - toUpdate.length,
    invalidRows,
    importedRecords,
  };
};

module.exports = {
  processStudentImport,
  processFacultyImport,
  generateStudentPassword,
  generateFacultyPassword,
};
