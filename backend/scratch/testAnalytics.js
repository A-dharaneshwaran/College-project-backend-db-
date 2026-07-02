const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const analyticsService = require('../src/services/analytics.service');

const run = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kce_management';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected for Analytics verification');

    const overview = await analyticsService.getDashboardOverview();
    console.log('--- Overview Analytics ---');
    console.log('Average Attendance:', overview.performance.averageAttendance);
    console.log('Average CGPA:', overview.performance.averageCgpa);
    console.log('Pass Percentage:', overview.performance.passPercentage);
    console.log('Students with Backlogs:', overview.performance.studentsWithBacklogs);

    const perf = await analyticsService.getPerformanceAnalytics();
    console.log('--- Performance Analytics ---');
    console.log('Department performance count:', perf.byDepartment.datasets[0].data.length);
    console.log('Top students count:', perf.topStudents.length);
    console.log('Weak students count:', perf.weakStudents.length);
    
    if (perf.topStudents.length > 0) {
      console.log('Top Student Example:', perf.topStudents[0]);
    }

    const demographics = await analyticsService.getDemographics();
    console.log('--- Demographics ---');
    console.log('Semester labels:', demographics.semester.labels);
    console.log('Semester counts:', demographics.semester.datasets[0].data);

    process.exit(0);
  } catch (error) {
    console.error('Error during analytics verification:', error);
    process.exit(1);
  }
};

run();
