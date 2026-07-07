/**
 * Bulk Controller
 * Handles all bulk import/export/template HTTP requests.
 * All routes are admin-only (enforced at route level).
 */

const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../services/activityLog.service');

const {
  processStudentImport,
  processFacultyImport,
} = require('../services/bulkImport.service');

const {
  exportStudents,
  exportFaculty,
  generateStudentTemplate,
  generateFacultyTemplate,
  generatePasswordReport,
} = require('../services/bulkExport.service');

// ─── Helpers ───────────────────────────────────────────────────────────────

const crypto = require('crypto');
const credentialsCache = new Map();

const addToCredentialsCache = (records, type) => {
  const downloadId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  credentialsCache.set(downloadId, {
    records,
    type,
    createdAt: Date.now()
  });
  
  // Auto-cleanup after 10 minutes
  setTimeout(() => {
    credentialsCache.delete(downloadId);
  }, 10 * 60 * 1000);
  
  return downloadId;
};

const streamFile = (res, buffer, filename, contentType) => {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
};

const logActivityHelper = async (adminUserId, action, module, description, data = {}) => {
  await logActivity({
    adminUser: adminUserId,
    action,
    module,
    description,
    metadata: data,
  });
};

// ─── Template Downloads ────────────────────────────────────────────────────

/**
 * GET /api/bulk/students/template
 */
const downloadStudentTemplate = catchAsync(async (req, res) => {
  const { buffer, filename, contentType } = generateStudentTemplate();
  streamFile(res, buffer, filename, contentType);
});

/**
 * GET /api/bulk/faculty/template
 */
const downloadFacultyTemplate = catchAsync(async (req, res) => {
  const { buffer, filename, contentType } = generateFacultyTemplate();
  streamFile(res, buffer, filename, contentType);
});

// ─── Import ────────────────────────────────────────────────────────────────

/**
 * POST /api/bulk/students/import
 * Query params:
 *   ?preview=true   → validate and return counts (no DB writes)
 *   ?mode=create_only | update_only | create_update  (default: create_only)
 *   ?credentials=true → return credentials xlsx after import
 */
const importStudents = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded. Please attach an xlsx or csv file.');
  }

  const previewOnly = req.query.preview === 'true';
  const mode = req.query.mode || 'create_only';
  const validModes = ['create_only', 'update_only', 'create_update'];
  if (!validModes.includes(mode)) {
    throw new ApiError(400, `Invalid mode. Must be one of: ${validModes.join(', ')}`);
  }

  const result = await processStudentImport(
    req.file.buffer,
    req.file.originalname,
    mode,
    previewOnly
  );

  if (previewOnly) {
    return res.status(200).json(
      new ApiResponse(200, 'Preview generated successfully', result)
    );
  }

  // Log activity
  await logActivityHelper(
    req.user._id,
    'Bulk Student Import',
    'Students',
    `Imported ${result.importedCount} student(s) successfully, ${result.failedCount} failed.`,
    {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      importMode: mode,
      fileName: req.file.originalname,
    }
  );

  // If admin requested the credentials file directly, stream it back instead of JSON
  if (req.query.credentials === 'true' && result.importedRecords?.length > 0) {
    const { buffer, filename, contentType } = generatePasswordReport(result.importedRecords, 'student');
    return streamFile(res, buffer, filename, contentType);
  }

  const downloadId = result.importedRecords?.length > 0 
    ? addToCredentialsCache(result.importedRecords, 'student')
    : null;

  // Sanitize passwords from JSON response
  const sanitizedRecords = result.importedRecords?.map(rec => {
    const { temporaryPassword, ...rest } = rec;
    return rest;
  }) || [];

  return res.status(200).json(
    new ApiResponse(200, `Import completed. ${result.importedCount} created, ${result.updatedCount} updated.`, {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      invalidRows: result.invalidRows,
      hasCredentials: !!downloadId,
      credentialsDownloadId: downloadId,
      importedRecords: sanitizedRecords,
    })
  );
});

/**
 * POST /api/bulk/faculty/import
 */
const importFaculty = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded. Please attach an xlsx or csv file.');
  }

  const previewOnly = req.query.preview === 'true';
  const mode = req.query.mode || 'create_only';
  const validModes = ['create_only', 'update_only', 'create_update'];
  if (!validModes.includes(mode)) {
    throw new ApiError(400, `Invalid mode. Must be one of: ${validModes.join(', ')}`);
  }

  const result = await processFacultyImport(
    req.file.buffer,
    req.file.originalname,
    mode,
    previewOnly
  );

  if (previewOnly) {
    return res.status(200).json(
      new ApiResponse(200, 'Preview generated successfully', result)
    );
  }

  await logActivityHelper(
    req.user._id,
    'Bulk Faculty Import',
    'Faculty',
    `Imported ${result.importedCount} faculty member(s) successfully, ${result.failedCount} failed.`,
    {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      importMode: mode,
      fileName: req.file.originalname,
    }
  );

  if (req.query.credentials === 'true' && result.importedRecords?.length > 0) {
    const { buffer, filename, contentType } = generatePasswordReport(result.importedRecords, 'faculty');
    return streamFile(res, buffer, filename, contentType);
  }

  const downloadId = result.importedRecords?.length > 0 
    ? addToCredentialsCache(result.importedRecords, 'faculty')
    : null;

  const sanitizedRecords = result.importedRecords?.map(rec => {
    const { temporaryPassword, ...rest } = rec;
    return rest;
  }) || [];

  return res.status(200).json(
    new ApiResponse(200, `Import completed. ${result.importedCount} created, ${result.updatedCount} updated.`, {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      invalidRows: result.invalidRows,
      hasCredentials: !!downloadId,
      credentialsDownloadId: downloadId,
      importedRecords: sanitizedRecords,
    })
  );
});

// ─── Export ────────────────────────────────────────────────────────────────

/**
 * GET /api/bulk/students/export
 * Query: ?format=xlsx&dept=CSE&semester=5&year=3&section=A
 */
const exportStudentsHandler = catchAsync(async (req, res) => {
  const filters = {
    dept: req.query.dept,
    semester: req.query.semester,
    year: req.query.year,
    section: req.query.section,
    format: req.query.format || 'xlsx',
  };

  const { buffer, filename, contentType } = await exportStudents(filters);

  await logActivityHelper(
    req.user._id,
    'Student Export',
    'Students',
    `Exported students data to ${filters.format.toUpperCase()} format`,
    {
      exportFilters: filters,
      fileName: filename,
    }
  );

  streamFile(res, buffer, filename, contentType);
});

/**
 * GET /api/bulk/faculty/export
 * Query: ?format=xlsx&dept=CSE&designation=Professor
 */
const exportFacultyHandler = catchAsync(async (req, res) => {
  const filters = {
    dept: req.query.dept,
    designation: req.query.designation,
    format: req.query.format || 'xlsx',
  };

  const { buffer, filename, contentType } = await exportFaculty(filters);

  await logActivityHelper(
    req.user._id,
    'Faculty Export',
    'Faculty',
    `Exported faculty data to ${filters.format.toUpperCase()} format`,
    {
      exportFilters: filters,
      fileName: filename,
    }
  );

  streamFile(res, buffer, filename, contentType);
});

// ─── Credentials Report Download ───────────────────────────────────────────

/**
 * POST /api/bulk/students/credentials
 * Body: { importedRecords: [...], downloadId: '...' }
 * Generates and streams a one-time credentials xlsx from a given records array or downloadId.
 */
const downloadStudentCredentials = catchAsync(async (req, res) => {
  const { importedRecords, downloadId } = req.body;
  let records = importedRecords;

  if (downloadId) {
    const cached = credentialsCache.get(downloadId);
    if (cached) {
      records = cached.records;
      credentialsCache.delete(downloadId);
    }
  }

  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'No imported records provided for credentials report or download link expired.');
  }

  const { buffer, filename, contentType } = generatePasswordReport(records, 'student');
  streamFile(res, buffer, filename, contentType);
});

/**
 * POST /api/bulk/faculty/credentials
 */
const downloadFacultyCredentials = catchAsync(async (req, res) => {
  const { importedRecords, downloadId } = req.body;
  let records = importedRecords;

  if (downloadId) {
    const cached = credentialsCache.get(downloadId);
    if (cached) {
      records = cached.records;
      credentialsCache.delete(downloadId);
    }
  }

  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'No imported records provided for credentials report or download link expired.');
  }

  const { buffer, filename, contentType } = generatePasswordReport(records, 'faculty');
  streamFile(res, buffer, filename, contentType);
});

module.exports = {
  downloadStudentTemplate,
  downloadFacultyTemplate,
  importStudents,
  importFaculty,
  exportStudentsHandler,
  exportFacultyHandler,
  downloadStudentCredentials,
  downloadFacultyCredentials,
};
