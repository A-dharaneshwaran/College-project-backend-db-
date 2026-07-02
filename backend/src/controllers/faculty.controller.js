const facultyService = require('../services/faculty.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

const getFacultyList = catchAsync(async (req, res) => {
  const result = await facultyService.queryFaculty(req.query);
  res.status(200).json(new ApiResponse(200, 'Faculty list retrieved successfully', result));
});

const getFacultyProfile = catchAsync(async (req, res) => {
  const faculty = await facultyService.getFacultyByUserId(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Faculty profile retrieved successfully', faculty));
});

const updateFacultyProfile = catchAsync(async (req, res) => {
  const faculty = await facultyService.getFacultyByUserId(req.user._id);
  const updatedFaculty = await facultyService.updateFaculty(faculty._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Faculty profile updated successfully', updatedFaculty));
});

const getFacultyStudents = catchAsync(async (req, res) => {
  const faculty = await facultyService.getFacultyByUserId(req.user._id);
  const students = await facultyService.getAssignedStudents(faculty._id);
  res.status(200).json(new ApiResponse(200, 'Department students retrieved successfully', students));
});

const getFaculty = catchAsync(async (req, res) => {
  const faculty = await facultyService.getFacultyById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Faculty details retrieved successfully', faculty));
});

const updateFaculty = catchAsync(async (req, res) => {
  const faculty = await facultyService.updateFaculty(req.params.id, req.body);
  
  if (req.user && req.user.role === 'admin') {
    const facultyName = faculty.user?.name || faculty.name || '';
    await logActivity({
      adminUser: req.user._id,
      action: 'Faculty Updated',
      module: 'Faculty',
      entityId: faculty._id,
      entityType: 'Faculty',
      description: `Updated faculty profile: ${facultyName} (${faculty.employeeId})`,
      metadata: {
        employeeId: faculty.employeeId,
        fieldsUpdated: Object.keys(req.body)
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Faculty details updated successfully', faculty));
});

const deleteFaculty = catchAsync(async (req, res) => {
  let facultyName = '';
  let empId = '';
  try {
    const faculty = await facultyService.getFacultyById(req.params.id);
    if (faculty) {
      facultyName = faculty.user?.name || faculty.name || '';
      empId = faculty.employeeId || '';
    }
  } catch (err) {
    console.error('Failed to get faculty details for delete log:', err.message);
  }

  await facultyService.deleteFaculty(req.params.id);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Faculty Deleted',
      module: 'Faculty',
      entityId: req.params.id,
      entityType: 'Faculty',
      description: `Deleted faculty profile: ${facultyName || 'Unknown'} (${empId || 'Unknown'})`,
      metadata: {
        facultyId: req.params.id,
        employeeId: empId,
        name: facultyName
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Faculty deleted successfully', null));
});

module.exports = {
  getFacultyList,
  getFacultyProfile,
  updateFacultyProfile,
  getFacultyStudents,
  getFaculty,
  updateFaculty,
  deleteFaculty
};
