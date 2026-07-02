import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [activities, setActivities] = useState([]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Admin Dashboard Statistics
            const statsRes = await api.get('/admins/dashboard');
            setStats(statsRes.data);

            // 2. Fetch Departments list
            const deptsRes = await api.get('/departments');
            setDepartments(deptsRes.data?.data || []);

            // 3. Extract recent administrative actions from the stats response activitySummary
            const recentActions = statsRes.data?.activitySummary?.recentActions || [];
            const formattedActivities = recentActions.map((log) => {
                const timeDiff = new Date() - new Date(log.createdAt);
                const minsAgo = Math.floor(timeDiff / (1000 * 60));
                let timeStr = 'Just now';
                if (minsAgo > 0) {
                    if (minsAgo < 60) {
                        timeStr = `${minsAgo}m ago`;
                    } else {
                        const hrsAgo = Math.floor(minsAgo / 60);
                        if (hrsAgo < 24) {
                            timeStr = `${hrsAgo}h ago`;
                        } else {
                            const daysAgo = Math.floor(hrsAgo / 24);
                            timeStr = `${daysAgo}d ago`;
                        }
                    }
                }

                let icon = 'cog';
                let color = '#FF5722';
                let bg = '#FBE9E7';

                if (log.module === 'Students') {
                    icon = 'graduation-cap';
                    color = '#0056D2';
                    bg = '#E3F2FD';
                } else if (log.module === 'Faculty') {
                    icon = 'user';
                    color = '#00A86B';
                    bg = '#E8F5E9';
                } else if (log.module === 'Departments') {
                    icon = 'building';
                    color = '#FF8C00';
                    bg = '#FFF3E0';
                } else if (log.module === 'Discipline') {
                    icon = 'gavel';
                    color = '#C62828';
                    bg = '#FFEBEE';
                } else if (log.module === 'Announcements') {
                    icon = 'bullhorn';
                    color = '#6A0DAD';
                    bg = '#F3E5F5';
                } else if (log.module === 'Illegal Activities') {
                    icon = 'exclamation-triangle';
                    color = '#37474F';
                    bg = '#ECEFF1';
                }

                return {
                    text: `${log.action} - ${log.description}`,
                    subText: `By ${log.adminUser?.name || 'Admin'}`,
                    time: timeStr,
                    icon,
                    color,
                    bg
                };
            });
            setActivities(formattedActivities);
        } catch (error) {
            console.error('Error loading admin dashboard stats:', error);
            Alert.alert('Error', 'Failed to load administrator dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: logout, style: 'destructive' }
        ]);
    };

    const overviewStats = [
        { label: 'Students', value: stats ? String(stats.students) : '0', icon: 'graduation-cap', color: '#0056D2', bg: '#E3F2FD' },
        { label: 'Faculty', value: stats ? String(stats.faculty) : '0', icon: 'user', color: '#00A86B', bg: '#E8F5E9' },
        { label: 'Depts', value: stats ? String(stats.departments).padStart(2, '0') : '00', icon: 'building', color: '#FF8C00', bg: '#FFF3E0' },
        { label: 'Unresolved', value: stats ? String(stats.discipline + stats.openQueries) : '0', icon: 'tasks', color: '#6A0DAD', bg: '#F3E5F5' },
    ];

    const menuItems = [
        { title: 'Manage Students', icon: 'users', route: '/admin/manage-students', color: '#3F51B5', bg: '#E8EAF6' },
        { title: 'Manage Faculty', icon: 'id-card', route: '/admin/manage-faculty', color: '#009688', bg: '#E0F2F1' },
        { title: 'Departments', icon: 'sitemap', route: '/admin/departments', color: '#FF9800', bg: '#FFF3E0' },
        { title: 'Discipline', icon: 'gavel', route: '/admin/discipline', color: '#C62828', bg: '#FFEBEE' },
        { title: 'Illegal Acts', icon: 'exclamation-triangle', route: '/admin/illegal-activities', color: '#37474F', bg: '#ECEFF1' },
        { title: 'Activity History', icon: 'history', route: '/admin/activity-history', color: '#FF5722', bg: '#FBE9E7' },
        { title: 'Analytics', icon: 'bar-chart', route: '/admin/analytics', color: '#4caf50', bg: '#E8F5E9' },
        { title: 'Messaging', icon: 'comments', route: '/admin/messages', color: '#1a237e', bg: '#E8EAF6' },
    ];

    const getDeptColor = (index) => {
        const colors = ['#1a237e', '#c62828', '#fbc02d', '#ef6c00', '#00695c', '#6a0dad'];
        return colors[index % colors.length];
    };

    if (loading && !stats) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#B71C1C" />
                <Text style={{ marginTop: 10, color: '#666' }}>Initializing administrator console...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Profile Card */}
                <LinearGradient
                    colors={['#B71C1C', '#D32F2F']} // Red Theme for Admin
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.headerCard}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeLabel}>Administrator Area</Text>
                            <Text style={styles.userName}>{user?.name || 'System Admin'}</Text>
                            <Text style={styles.userDept}>Control Center</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <MaterialIcons name="logout" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* System Health */}
                    <View style={styles.healthRow}>
                        <View style={styles.healthItem}>
                            <View style={[styles.healthDot, { backgroundColor: '#4caf50' }]} />
                            <Text style={styles.healthText}>Server OK</Text>
                        </View>
                        <View style={styles.healthItem}>
                            <View style={[styles.healthDot, { backgroundColor: '#4caf50' }]} />
                            <Text style={styles.healthText}>DB Connected</Text>
                        </View>
                        <View style={styles.healthItem}>
                            <View style={[styles.healthDot, { backgroundColor: '#FF8C00' }]} />
                            <Text style={styles.healthText}>Update v2.1</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.contentBody}>

                    {/* Overview Stats */}
                    <View style={styles.statsGrid}>
                        {overviewStats.map((stat, index) => (
                            <Animated.View key={index} entering={ZoomIn.delay(index * 50)} style={styles.statCardWrapper}>
                                <View style={styles.statCard}>
                                    <View style={[styles.statIconBox, { backgroundColor: stat.bg }]}>
                                        <FontAwesome name={stat.icon} size={18} color={stat.color} />
                                    </View>
                                    <View>
                                        <Text style={styles.statValue}>{stat.value}</Text>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Quick Menu */}
                    <Text style={styles.sectionTitle}>Administration</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuCard}
                                onPress={() => item.route ? router.push(item.route) : item.action?.()}
                            >
                                <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                                    <FontAwesome name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Department Analytics */}
                    <Text style={styles.sectionTitle}>Department Overview</Text>
                    <View style={styles.analyticsCard}>
                        {departments.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 10 }}>No departments configured</Text>
                        ) : (
                            departments.map((dept, index) => (
                                <View key={index} style={styles.deptRow}>
                                    <View style={styles.deptInfo}>
                                        <Text style={styles.deptName}>{dept.code} - {dept.name}</Text>
                                        <Text style={styles.deptCounts}>
                                            {(dept.students || []).length} Students • {(dept.faculty || []).length} Faculty
                                        </Text>
                                    </View>
                                    <View style={styles.deptBarWrapper}>
                                        <View style={[styles.deptBar, { width: `${Math.min(100, (((dept.students || []).length) / 5) * 100)}%`, backgroundColor: getDeptColor(index) }]} />
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Compact Activity Widget */}
                    <Text style={styles.sectionTitle}>Daily Activity Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryStatsRow}>
                            <View style={styles.summaryStatBox}>
                                <Text style={styles.summaryStatValue}>
                                    {stats?.activitySummary?.todayStudentImports || 0}
                                </Text>
                                <Text style={styles.summaryStatLabel}>Student Imports</Text>
                            </View>
                            <View style={styles.summaryStatBox}>
                                <Text style={styles.summaryStatValue}>
                                    {stats?.activitySummary?.todayFacultyImports || 0}
                                </Text>
                                <Text style={styles.summaryStatLabel}>Faculty Imports</Text>
                            </View>
                            <View style={styles.summaryStatBox}>
                                <Text style={styles.summaryStatValue}>
                                    {stats?.activitySummary?.todayExports || 0}
                                </Text>
                                <Text style={styles.summaryStatLabel}>Exports Today</Text>
                            </View>
                        </View>
                        
                        <View style={styles.summaryTimestamps}>
                            <View style={styles.timestampRow}>
                                <FontAwesome name="upload" size={12} color="#555" style={{ marginRight: 6 }} />
                                <Text style={styles.timestampLabel}>Last Import: </Text>
                                <Text style={styles.timestampValue}>
                                    {stats?.activitySummary?.lastImportTime ? new Date(stats.activitySummary.lastImportTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                </Text>
                            </View>
                            <View style={styles.timestampRow}>
                                <FontAwesome name="download" size={12} color="#555" style={{ marginRight: 6 }} />
                                <Text style={styles.timestampLabel}>Last Export: </Text>
                                <Text style={styles.timestampValue}>
                                    {stats?.activitySummary?.lastExportTime ? new Date(stats.activitySummary.lastExportTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Recent Activities */}
                    <Text style={styles.sectionTitle}>Recent Administrative Actions</Text>
                    <View style={styles.activityList}>
                        {activities.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 20, paddingHorizontal: 10 }}>No recent administrative actions logged</Text>
                        ) : (
                            activities.map((act, index) => (
                                <Animated.View key={index} entering={FadeInRight.delay(index * 100)} style={styles.activityItem}>
                                    <View style={[styles.actIcon, { backgroundColor: act.bg }]}>
                                        <FontAwesome name={act.icon} size={14} color={act.color} />
                                    </View>
                                    <View style={styles.actContent}>
                                        <Text style={styles.actText}>{act.text}</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, alignItems: 'center' }}>
                                            <Text style={styles.actSubText}>{act.subText}</Text>
                                            <Text style={styles.actTime}>{act.time}</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </View>

                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    headerCard: {
        paddingTop: Platform.OS === 'android' ? 60 : 30,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#B71C1C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    welcomeLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '500',
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    userDept: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },
    logoutBtn: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    healthRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'space-around',
    },
    healthItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    healthDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    healthText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    contentBody: {
        paddingHorizontal: 20,
        marginTop: -30,
        paddingTop: 40,
        zIndex: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statCardWrapper: {
        width: '48%',
        marginBottom: 15,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 5,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    menuCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuIconBox: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontWeight: '600',
        color: '#333',
        fontSize: 14,
    },
    analyticsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    deptRow: {
        marginBottom: 16,
    },
    deptInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    deptName: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 14,
    },
    deptCounts: {
        color: '#888',
        fontSize: 11,
    },
    deptBarWrapper: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    deptBar: {
        height: '100%',
        borderRadius: 4,
    },
    activityList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    actIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actContent: {
        flex: 1,
    },
    actText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
        marginBottom: 2,
    },
    actTime: {
        fontSize: 11,
        color: '#999',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 15,
    },
    summaryStatBox: {
        alignItems: 'center',
        flex: 1,
    },
    summaryStatValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#B71C1C',
        marginBottom: 4,
    },
    summaryStatLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    summaryTimestamps: {
        paddingHorizontal: 10,
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    timestampLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#444',
    },
    timestampValue: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    actSubText: {
        fontSize: 11,
        color: '#777',
        fontWeight: '500',
    },
});
