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
  await logActivityHelper(req.user._id, 'Template Downloaded', 'Students', 'Downloaded bulk student template Excel sheet', { fileName: filename });
  streamFile(res, buffer, filename, contentType);
});

/**
 * GET /api/bulk/faculty/template
 */
const downloadFacultyTemplate = catchAsync(async (req, res) => {
  const { buffer, filename, contentType } = generateFacultyTemplate();
  await logActivityHelper(req.user._id, 'Template Downloaded', 'Faculty', 'Downloaded bulk faculty template Excel sheet', { fileName: filename });
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

  // If admin requested the credentials file, stream it back instead of JSON
  if (req.query.credentials === 'true' && result.importedRecords?.length > 0) {
    const { buffer, filename, contentType } = generatePasswordReport(result.importedRecords, 'student');
    return streamFile(res, buffer, filename, contentType);
  }

  return res.status(200).json(
    new ApiResponse(200, `Import completed. ${result.importedCount} created, ${result.updatedCount} updated.`, {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      invalidRows: result.invalidRows,
      hasCredentials: result.importedRecords?.length > 0,
      // Include credentials inline (for small imports / UI display)
      importedRecords: result.importedRecords,
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

  return res.status(200).json(
    new ApiResponse(200, `Import completed. ${result.importedCount} created, ${result.updatedCount} updated.`, {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      invalidRows: result.invalidRows,
      hasCredentials: result.importedRecords?.length > 0,
      importedRecords: result.importedRecords,
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
 * Body: { importedRecords: [...] }
 * Generates and streams a one-time credentials xlsx from a given records array.
 */
const downloadStudentCredentials = catchAsync(async (req, res) => {
  const { importedRecords } = req.body;
  if (!importedRecords || !Array.isArray(importedRecords) || importedRecords.length === 0) {
    throw new ApiError(400, 'No imported records provided for credentials report.');
  }

  const { buffer, filename, contentType } = generatePasswordReport(importedRecords, 'student');
  streamFile(res, buffer, filename, contentType);
});

/**
 * POST /api/bulk/faculty/credentials
 */
const downloadFacultyCredentials = catchAsync(async (req, res) => {
  const { importedRecords } = req.body;
  if (!importedRecords || !Array.isArray(importedRecords) || importedRecords.length === 0) {
    throw new ApiError(400, 'No imported records provided for credentials report.');
  }

  const { buffer, filename, contentType } = generatePasswordReport(importedRecords, 'faculty');
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
