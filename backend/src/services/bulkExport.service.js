/**
 * Bulk Export Service
 * Handles student/faculty export to Excel (.xlsx) and CSV,
 * and template generation.
 */

const xlsx = require('xlsx');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert an array of plain objects to an xlsx workbook buffer.
 * @param {Array<Object>} rows
 * @param {string} sheetName
 * @returns {Buffer}
 */
const buildXlsxBuffer = (rows, sheetName = 'Sheet1') => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Convert an array of plain objects to a CSV buffer.
 */
const buildCsvBuffer = (rows) => {
  if (!rows || rows.length === 0) return Buffer.from('');
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '').replace(/"/g, '""');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val}"`
          : val;
      }).join(',')
    )
  ];
  return Buffer.from(lines.join('\n'), 'utf-8');
};

// ─── Student Export ────────────────────────────────────────────────────────

/**
 * Export students to Excel or CSV buffer.
 *
 * @param {Object} filters - { dept, semester, year, section, format }
 * @returns {{ buffer: Buffer, filename: string, contentType: string }}
 */
const exportStudents = async (filters = {}) => {
  const query = {};

  if (filters.dept) {
    // Accept dept as either a code or an ObjectId
    const Department = require('../models/Department');
    const deptDoc = await Department.findOne({ code: filters.dept.toUpperCase() });
    if (deptDoc) query.department = deptDoc._id;
  }

  if (filters.semester) query.semester = parseInt(filters.semester, 10);
  if (filters.year) query.year = parseInt(filters.year, 10);
  if (filters.section) query.section = filters.section.toUpperCase();

  const students = await Student.find(query)
    .populate('user', 'name email')
    .populate('department', 'name code')
    .lean();

  const rows = students.map(s => ({
    'Register Number': s.registerNumber || '',
    'Full Name': s.user?.name || '',
    'Email': s.user?.email || '',
    'Department Code': s.department?.code || '',
    'Department Name': s.department?.name || '',
    'Year': s.year || '',
    'Semester': s.semester || '',
    'Phone Number': s.phone || '',
    'Gender': s.gender || '',
    'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
    'Father Name': s.parentDetails?.fatherName || '',
    'Father Phone': s.parentDetails?.fatherPhone || '',
    'Mother Name': s.parentDetails?.motherName || '',
    'Mother Phone': s.parentDetails?.motherPhone || '',
    'Admission Date': s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '',
  }));

  const format = (filters.format || 'xlsx').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    return {
      buffer: buildCsvBuffer(rows),
      filename: `students_export_${timestamp}.csv`,
      contentType: 'text/csv',
    };
  }

  return {
    buffer: buildXlsxBuffer(rows, 'Students'),
    filename: `students_export_${timestamp}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

// ─── Faculty Export ────────────────────────────────────────────────────────

/**
 * Export faculty to Excel or CSV buffer.
 *
 * @param {Object} filters - { dept, designation, format }
 * @returns {{ buffer: Buffer, filename: string, contentType: string }}
 */
const exportFaculty = async (filters = {}) => {
  const query = {};

  if (filters.dept) {
    const Department = require('../models/Department');
    const deptDoc = await Department.findOne({ code: filters.dept.toUpperCase() });
    if (deptDoc) query.department = deptDoc._id;
  }

  if (filters.designation) query.designation = { $regex: filters.designation, $options: 'i' };

  const facultyList = await Faculty.find(query)
    .populate('user', 'name email')
    .populate('department', 'name code')
    .populate('subjects', 'name code')
    .lean();

  const rows = facultyList.map(f => ({
    'Employee ID': f.employeeId || '',
    'Full Name': f.user?.name || '',
    'Email': f.user?.email || '',
    'Department Code': f.department?.code || '',
    'Department Name': f.department?.name || '',
    'Designation': f.designation || '',
    'Specialization': f.specialization || '',
    'Phone Number': f.phone || '',
    'Subjects': (f.subjects || []).map(s => s.name || s.code || '').join(', '),
    'Joining Date': f.joiningDate ? new Date(f.joiningDate).toISOString().split('T')[0] : '',
  }));

  const format = (filters.format || 'xlsx').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    return {
      buffer: buildCsvBuffer(rows),
      filename: `faculty_export_${timestamp}.csv`,
      contentType: 'text/csv',
    };
  }

  return {
    buffer: buildXlsxBuffer(rows, 'Faculty'),
    filename: `faculty_export_${timestamp}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

// ─── Template Generation ───────────────────────────────────────────────────

/**
 * Generate a downloadable student import template (xlsx).
 * Contains only the header row + one example row.
 */
const generateStudentTemplate = () => {
  const rows = [
    {
      'Register Number': '722821104001',
      'Full Name': 'Aarav Kumar',
      'Email': 'aarav.kumar@kce.edu',
      'Department Code': 'CSE',
      'Semester': 5,
      'Year': 3,
      'Section': 'A',
      'Phone Number': '9876543210',
      'Father Name': 'Suresh Kumar',
      'Father Phone': '9876543211',
      'Mother Name': 'Priya Kumar',
      'Mother Phone': '9876543212',
      'Gender': 'Male',
      'Date of Birth': '2004-06-15',
    },
  ];

  const buffer = buildXlsxBuffer(rows, 'Students Template');
  return {
    buffer,
    filename: 'student_import_template.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

/**
 * Generate a downloadable faculty import template (xlsx).
 */
const generateFacultyTemplate = () => {
  const rows = [
    {
      'Employee ID': 'KCE-FAC001',
      'Full Name': 'Dr. Ramesh Sharma',
      'Email': 'ramesh.sharma@kce.edu',
      'Department Code': 'CSE',
      'Designation': 'Associate Professor',
      'Subjects': 'Data Structures, Algorithms',
      'Experience': '8 years',
      'Phone Number': '9876543210',
      'Specialization': 'Artificial Intelligence',
    },
  ];

  const buffer = buildXlsxBuffer(rows, 'Faculty Template');
  return {
    buffer,
    filename: 'faculty_import_template.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

/**
 * Generate the post-import credentials report (xlsx).
 * Contains Name, Email, ID, TemporaryPassword.
 * Generated once and streamed — never stored in DB.
 */
const generatePasswordReport = (importedRecords, type = 'student') => {
  const rows = importedRecords.map(r => ({
    'Full Name': r.name,
    'Email': r.email,
    ...(type === 'student'
      ? { 'Register Number': r.registerNumber }
      : { 'Employee ID': r.employeeId }
    ),
    'Temporary Password': r.temporaryPassword,
  }));

  const buffer = buildXlsxBuffer(rows, 'Credentials');
  const timestamp = new Date().toISOString().slice(0, 10);
  return {
    buffer,
    filename: `${type}_credentials_${timestamp}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

module.exports = {
  exportStudents,
  exportFaculty,
  generateStudentTemplate,
  generateFacultyTemplate,
  generatePasswordReport,
};
