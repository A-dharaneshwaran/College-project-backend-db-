import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import StatCard from '../../components/charts/StatCard';
import { BarChart, LineChart, PieChart } from '../../components/charts/ChartComponents';
import RankingTable from '../../components/charts/RankingTable';
import ReportExporter from '../../components/reports/ReportExporter';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { data, loading, error, fetchAnalytics, exportReport } = useAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // Parallel fetching for performance
    await Promise.all([
      fetchAnalytics('dashboard'),
      fetchAnalytics('attendance'),
      fetchAnalytics('performance'),
      fetchAnalytics('departments'),
      fetchAnalytics('demographics'),
      fetchAnalytics('activity'),
      fetchAnalytics('notifications')
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (!data.overview && loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Compiling Analytics...</Text>
      </View>
    );
  }

  if (error && !data.overview) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning" size={48} color="#C62828" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const { overview, attendance, performance, departments, demographics, activity, notifications } = data;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enterprise Analytics</Text>
        <Text style={styles.headerSubtitle}>Real-time institutional insights</Text>
      </View>

      {/* KPI Row 1: Institutional */}
      <View style={styles.cardRow}>
        <StatCard 
          title="Total Students" 
          value={overview?.institution?.totalStudents || 0} 
          icon="people" 
          color="#1976D2" 
        />
        <StatCard 
          title="Total Faculty" 
          value={overview?.institution?.totalFaculty || 0} 
          icon="school" 
          color="#2E7D32" 
        />
      </View>

      {/* KPI Row 2: Performance */}
      <View style={styles.cardRow}>
        <StatCard 
          title="Avg Attendance" 
          value={`${overview?.performance?.averageAttendance?.toFixed(1) || 0}%`} 
          icon="calendar" 
          color="#F57F17" 
        />
        <StatCard 
          title="Overall Pass Rate" 
          value={`${overview?.performance?.passPercentage?.toFixed(1) || 0}%`} 
          icon="ribbon" 
          color="#6A1B9A" 
        />
      </View>

      {/* Main Charts */}
      <View style={styles.section}>
        <BarChart 
          title="Department Distribution (Students vs Faculty)"
          data={departments?.distribution}
        />
      </View>

      <View style={styles.section}>
        <LineChart 
          title="Monthly Attendance Trend"
          data={attendance?.trend}
        />
      </View>

      <View style={styles.sectionRow}>
        <View style={{ flex: 1 }}>
          <PieChart 
            title="Gender Demographics"
            data={demographics?.gender}
            width={300}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PieChart 
            title="Year Demographics"
            data={demographics?.year}
            width={300}
          />
        </View>
      </View>

      <View style={styles.section}>
        <LineChart 
          title="Daily Active Users (Last 30 Days)"
          data={activity?.trend}
        />
      </View>

      <View style={styles.section}>
        <RankingTable 
          title="Department Ranking by Population"
          data={departments?.table}
          keyExtractor={(item) => item.department}
          columns={[
            { label: 'Department', key: 'department', style: { flex: 2 } },
            { label: 'Students', key: 'students' },
            { label: 'Faculty', key: 'faculty' },
            { label: 'Ratio (S/F)', key: 'ratio' }
          ]}
        />
      </View>

      <View style={styles.section}>
        <RankingTable 
          title="Top Performing Students (CGPA)"
          data={performance?.topStudents}
          keyExtractor={(item) => item.registerNumber}
          columns={[
            { label: 'Student', key: 'name', style: { flex: 2 } },
            { label: 'Dept', key: 'department' },
            { label: 'CGPA', key: 'cgpa' }
          ]}
        />
      </View>

      <View style={styles.section}>
        <RankingTable 
          title="Students At Risk (Low CGPA)"
          data={performance?.weakStudents}
          keyExtractor={(item) => item.registerNumber}
          columns={[
            { label: 'Student', key: 'name', style: { flex: 2 } },
            { label: 'Dept', key: 'department' },
            { label: 'CGPA', key: 'cgpa' },
            { label: 'Arrears', key: 'historyOfArrears' }
          ]}
        />
      </View>

      {/* Export Section */}
      <View style={styles.section}>
        <ReportExporter onExport={exportReport} loading={loading && !refreshing} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#546E7A',
    fontWeight: '500'
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    paddingHorizontal: 20
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    marginTop: 4
  },
  cardRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  section: {
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -8,
  }
});
