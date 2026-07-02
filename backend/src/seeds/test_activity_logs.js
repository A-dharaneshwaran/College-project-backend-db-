const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const start = Date.now();
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        const latency = Date.now() - start;
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ statusCode: res.statusCode, body: parsed, latency });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: responseBody, latency });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
};

const runActivityTest = async () => {
  console.log('============================================================');
  console.log('🧪 RUNNING KCE ACTIVITY LOGGING TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  let testCount = 0;

  const assert = (condition, message) => {
    testCount++;
    if (condition) {
      passed++;
      console.log(`  🟢 PASS: ${message}`);
    } else {
      failed++;
      console.log(`  🔴 FAIL: ${message}`);
    }
  };

  try {
    // 1. Authenticate users
    console.log('🔐 [Section 1] Authentication and Authorization Guards');
    const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@kce.edu', password: 'Admin@123' });
    const adminToken = adminLogin.body.data?.token;
    assert(adminToken !== undefined, 'Admin authenticated successfully');

    const studentLogin = await request('POST', '/api/auth/login', { email: 'student@kce.edu', password: 'Student@123' });
    const studentToken = studentLogin.body.data?.token;
    assert(studentToken !== undefined, 'Student authenticated successfully');

    // 2. Test RBAC security guards
    const studentActivityCall = await request('GET', '/api/admins/activity', null, studentToken);
    assert(studentActivityCall.statusCode === 403, 'Student is blocked from Activity History endpoint (HTTP 403 Forbidden)');

    const noTokenActivityCall = await request('GET', '/api/admins/activity');
    assert(noTokenActivityCall.statusCode === 401, 'Unauthenticated request is blocked (HTTP 401 Unauthorized)');

    // 3. Test Activity filters and history list endpoints
    console.log('\n🔍 [Section 2] Activity History List & Filters Metadata');
    const filtersRes = await request('GET', '/api/admins/activity/filters', null, adminToken);
    assert(filtersRes.statusCode === 200, 'Admin can fetch activity history filters metadata');
    assert(Array.isArray(filtersRes.body.data?.modules), 'Response includes distinct modules list');
    assert(Array.isArray(filtersRes.body.data?.actions), 'Response includes distinct action types list');
    assert(Array.isArray(filtersRes.body.data?.admins), 'Response includes distinct administrators list');

    const historyRes = await request('GET', '/api/admins/activity', null, adminToken);
    assert(historyRes.statusCode === 200, 'Admin can query paginated activity history');
    assert(Array.isArray(historyRes.body.data?.data), 'Response data contains an array of log items');
    assert(historyRes.body.data?.pagination !== undefined, 'Response includes pagination metadata');

    // 4. Test Dashboard aggregate statistics
    console.log('\n📊 [Section 3] Admin Dashboard Summary Aggregates');
    const dashboardRes = await request('GET', '/api/admins/dashboard', null, adminToken);
    assert(dashboardRes.statusCode === 200, 'Admin dashboard statistics returned successfully');
    const activitySummary = dashboardRes.body.data?.activitySummary;
    assert(activitySummary !== undefined, 'Dashboard statistics includes "activitySummary" stats');
    assert(typeof activitySummary?.todayStudentImports === 'number', 'Student imports today count is a number');
    assert(typeof activitySummary?.todayFacultyImports === 'number', 'Faculty imports today count is a number');
    assert(typeof activitySummary?.todayExports === 'number', 'Exports today count is a number');
    assert(Array.isArray(activitySummary?.recentActions), 'Dashboard recent actions is an array');

    // 5. Test controller integrations
    console.log('\n⚡ [Section 4] Controller Integrations & Activity Logging');
    console.log('  🔄 Registering a temporary department to trigger create logging...');
    const createDept = await request('POST', '/api/departments', { name: 'Log Verification Dept', code: 'LOGV' }, adminToken);
    assert(createDept.statusCode === 201, 'Temporary department created successfully');
    const deptId = createDept.body.data?._id;

    if (deptId) {
      console.log('  🔄 Updating the temporary department to trigger update logging...');
      const updateDept = await request('PUT', `/api/departments/${deptId}`, { name: 'Log Verification Dept Updated' }, adminToken);
      assert(updateDept.statusCode === 200, 'Temporary department updated successfully');

      console.log('  🔄 Deleting the temporary department to trigger delete logging...');
      const deleteDept = await request('DELETE', `/api/departments/${deptId}`, null, adminToken);
      assert(deleteDept.statusCode === 200, 'Temporary department deleted successfully');

      // Check that they are logged in Activity History
      console.log('  🔄 Verifying that the create, update, and delete actions were logged...');
      const checkHistory = await request('GET', '/api/admins/activity?limit=10', null, adminToken);
      const items = checkHistory.body.data?.data || [];
      
      const createLogged = items.find(item => item.action === 'Department Created' && item.description.includes('LOGV'));
      const updateLogged = items.find(item => item.action === 'Department Updated' && item.description.includes('LOGV'));
      const deleteLogged = items.find(item => item.action === 'Department Deleted' && (item.entityId === deptId || item.description.includes('Log Verification Dept')));

      assert(createLogged !== undefined, 'Department Created operation was logged correctly');
      assert(updateLogged !== undefined, 'Department Updated operation was logged correctly');
      assert(deleteLogged !== undefined, 'Department Deleted operation was logged correctly');
    }

    console.log('\n============================================================');
    console.log('📊 ACTIVITY TEST SUITE COMPLETED');
    console.log('============================================================');
    console.log(`  Total Tests Run : ${testCount}`);
    console.log(`  Passed Tests    : ${passed}`);
    console.log(`  Failed Tests    : ${failed}`);
    console.log('============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL ACTIVITY LOGGING AND SECURITY TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Test suite encountered an error:', error);
    process.exit(1);
  }
};

runActivityTest();
