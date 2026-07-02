const departmentService = require('../services/department.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

const createDepartment = catchAsync(async (req, res) => {
  const dept = await departmentService.createDepartment(req.body);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Department Created',
      module: 'Departments',
      entityId: dept._id,
      entityType: 'Department',
      description: `Created department: ${dept.name} (${dept.code})`,
      metadata: {
        code: dept.code,
        name: dept.name
      }
    });
  }

  res.status(201).json(new ApiResponse(201, 'Department created successfully', dept));
});

const getDepartments = catchAsync(async (req, res) => {
  const result = await departmentService.queryDepartments(req.query);
  res.status(200).json(new ApiResponse(200, 'Departments retrieved successfully', result));
});

const getDepartment = catchAsync(async (req, res) => {
  const dept = await departmentService.getDepartmentById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Department retrieved successfully', dept));
});

const updateDepartment = catchAsync(async (req, res) => {
  const dept = await departmentService.updateDepartment(req.params.id, req.body);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Department Updated',
      module: 'Departments',
      entityId: dept._id,
      entityType: 'Department',
      description: `Updated department: ${dept.name} (${dept.code})`,
      metadata: {
        code: dept.code,
        name: dept.name,
        fieldsUpdated: Object.keys(req.body)
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Department updated successfully', dept));
});

const deleteDepartment = catchAsync(async (req, res) => {
  let deptName = '';
  let deptCode = '';
  try {
    const dept = await departmentService.getDepartmentById(req.params.id);
    if (dept) {
      deptName = dept.name;
      deptCode = dept.code;
    }
  } catch (err) {
    console.error('Failed to get department details for delete log:', err.message);
  }

  await departmentService.deleteDepartment(req.params.id);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Department Deleted',
      module: 'Departments',
      entityId: req.params.id,
      entityType: 'Department',
      description: `Deleted department: ${deptName || 'Unknown'} (${deptCode || 'Unknown'})`,
      metadata: {
        departmentId: req.params.id,
        code: deptCode,
        name: deptName
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Department deleted successfully', null));
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
};
