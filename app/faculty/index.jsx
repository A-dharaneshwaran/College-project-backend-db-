import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal, TextInput } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function FacultyDashboard() {
    const router = useRouter();
    const { logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [studentsCount, setStudentsCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [classAverages, setClassAverages] = useState([]);

    // Modal State
    const [announceModalVisible, setAnnounceModalVisible] = useState(false);
    const [announceTitle, setAnnounceTitle] = useState('');
    const [announceContent, setAnnounceContent] = useState('');
    const [submittingAnnounce, setSubmittingAnnounce] = useState(false);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch faculty profile details (populated with department & subjects)
            const profileRes = await api.get('/faculty/profile');
            const profileData = profileRes.data;
            setFacultyProfile(profileData);

            // 2. Fetch assigned students list count
            const studentsRes = await api.get('/faculty/students');
            const studentsList = studentsRes.data || [];
            setStudentsCount(studentsList.length);

            // 3. Fetch open queries to compute Pending count
            const queriesRes = await api.get('/queries');
            const queriesList = queriesRes.data?.data || [];
            const openQueries = queriesList.filter(q => q.status === 'open');
            setPendingCount(openQueries.length);

            // 4. Fetch class averages for up to 3 subjects
            if (profileData?.subjects && profileData.subjects.length > 0) {
                const averages = [];
                const colors = ['#00A86B', '#FF8C00', '#0056D2', '#6A0DAD'];
                
                // Load in parallel
                const avgPromises = profileData.subjects.slice(0, 3).map(async (sub, i) => {
                    try {
                        const marksRes = await api.get(`/marks/subject/${sub._id}`);
                        const marksList = marksRes.data || [];
                        if (marksList.length > 0) {
                            const totalObtained = marksList.reduce((sum, m) => sum + m.obtainedMarks, 0);
                            const totalMax = marksList.reduce((sum, m) => sum + m.maxMarks, 0);
                            const avg = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
                            return { label: sub.code, val: avg, color: colors[i % colors.length] };
                        } else {
                            return { label: sub.code, val: 85, color: colors[i % colors.length] };
                        }
                    } catch (err) {
                        console.log('Error loading marks for subject', sub.code, err);
                        return { label: sub.code, val: 80, color: colors[i % colors.length] };
                    }
                });

                const loadedAverages = await Promise.all(avgPromises);
                setClassAverages(loadedAverages);
            }
        } catch (error) {
            console.error('Error loading faculty dashboard:', error);
            Alert.alert('Error', 'Failed to load faculty dashboard data.');
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

    const handlePostAnnouncement = async () => {
        if (!announceTitle.trim() || !announceContent.trim()) {
            Alert.alert('Validation', 'Please fill in both title and content.');
            return;
        }

        setSubmittingAnnounce(true);
        try {
            await api.post('/announcements', {
                title: announceTitle.trim(),
                content: announceContent.trim(),
                targetAudience: 'department',
                department: facultyProfile?.department?._id
            });
            Alert.alert('Success', 'Announcement posted successfully.');
            setAnnounceModalVisible(false);
            setAnnounceTitle('');
            setAnnounceContent('');
        } catch (error) {
            console.error('Error posting announcement:', error);
            Alert.alert('Error', 'Failed to post announcement.');
        } finally {
            setSubmittingAnnounce(false);
        }
    };

    const quickActions = [
        { title: 'Upload Marks', icon: 'edit', route: '/faculty/updates?type=marks', color: '#0056D2', bg: '#E3F2FD' },
        { title: 'Attendance', icon: 'check-square-o', route: '/faculty/updates?type=attendance', color: '#00A86B', bg: '#E8F5E9' },
        { title: 'Discipline', icon: 'gavel', route: '/faculty/discipline', color: '#D32F2F', bg: '#FFEBEE' },
        { title: 'My Students', icon: 'users', route: '/faculty/students', color: '#6A0DAD', bg: '#F3E5F5' },
        { title: 'Announce', icon: 'bullhorn', route: null, color: '#FF8C00', bg: '#FFF3E0', action: () => setAnnounceModalVisible(true) },
        { title: 'Messages', icon: 'comments', route: '/faculty/messages', color: '#1a237e', bg: '#E8EAF6' },
    ];

    const stats = [
        { label: 'Classes', value: String(facultyProfile?.subjects?.length || 0), icon: 'book' },
        { label: 'Students', value: String(studentsCount), icon: 'users' },
        { label: 'Pending', value: String(pendingCount), icon: 'tasks' },
    ];

    // Build timeline events from subjects
    const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
    const colors = ['#0056D2', '#6A0DAD', '#00A86B', '#FF8C00'];
    const formattedSchedule = (facultyProfile?.subjects || []).map((sub, index) => ({
        time: times[index % times.length],
        subject: sub.name,
        class: `${facultyProfile?.department?.code || 'CSE'} Sem ${sub.semester}`,
        room: `LH-${101 + index * 4}`,
        status: index === 0 ? 'upcoming' : 'completed',
        color: colors[index % colors.length]
    }));

    if (loading && !facultyProfile) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading dashboard details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 🔷 Header Profile Card */}
                <LinearGradient
                    colors={['#2E7D32', '#66BB6A']} // Green Theme for Faculty
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.headerCard}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeLabel}>Faculty Portal</Text>
                            <Text style={styles.userName}>Prof. {facultyProfile?.user?.name || 'Faculty'}</Text>
                            <Text style={styles.userDept}>{facultyProfile?.department?.name || 'Academic Faculty'}</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <MaterialIcons name="logout" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats Dashboard */}
                    <View style={styles.statsContainer}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statBox}>
                                <View style={styles.statIconBox}>
                                    <FontAwesome name={stat.icon} size={16} color="rgba(255,255,255,0.9)" />
                                </View>
                                <View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                                {index !== stats.length - 1 && <View style={styles.statDivider} />}
                            </View>
                        ))}
                    </View>
                </LinearGradient>

                <View style={styles.contentBody}>

                    {/* 🔷 Quick Actions Grid */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.actionGrid}>
                            {quickActions.map((item, index) => (
                                <Animated.View key={index} entering={ZoomIn.delay(index * 50)} style={{ width: '48%', marginBottom: 15 }}>
                                    <TouchableOpacity
                                        style={styles.actionCard}
                                        activeOpacity={0.8}
                                        onPress={() => item.route ? router.push(item.route) : item.action?.()}
                                    >
                                        <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                                            <FontAwesome name={item.icon} size={20} color={item.color} />
                                        </View>
                                        <Text style={styles.actionText}>{item.title}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    </View>

                    {/* 🔷 Today's Schedule (Timeline) */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeaderLine}>
                            <Text style={styles.sectionTitle}>Today's Schedule</Text>
                            <TouchableOpacity><Text style={styles.seeAllText}>Calendar</Text></TouchableOpacity>
                        </View>

                        <View style={styles.timelineCard}>
                            {formattedSchedule.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 10 }}>No classes scheduled for today</Text>
                            ) : (
                                formattedSchedule.map((cls, index) => (
                                    <Animated.View key={index} entering={FadeInUp.delay(index * 100)} style={styles.timelineItem}>
                                        <View style={styles.timeColumn}>
                                            <Text style={styles.timeText}>{cls.time}</Text>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: cls.status === 'completed' ? '#ccc' : cls.color, borderColor: cls.status === 'completed' ? '#eee' : '#fff' }
                                            ]} />
                                            {index !== formattedSchedule.length - 1 && <View style={styles.lineLink} />}
                                        </View>
                                        <View style={[
                                            styles.classInfoCard,
                                            cls.status === 'completed' ? styles.classInfoCardCompleted : { borderLeftColor: cls.color }
                                        ]}>
                                            <View style={styles.classHeader}>
                                                <Text style={[styles.subjectName, cls.status === 'completed' && styles.textCompleted]}>{cls.subject}</Text>
                                                <View style={[styles.roomTag, cls.status === 'completed' && styles.roomTagCompleted]}>
                                                    <Text style={[styles.roomText, cls.status === 'completed' && styles.textCompleted]}>{cls.room}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.className}>{cls.class}</Text>
                                        </View>
                                    </Animated.View>
                                ))
                            )}
                        </View>
                    </View>

                    {/* 🔷 Performance Overview */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Class Average</Text>
                        <View style={styles.performanceCard}>
                            {classAverages.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 10 }}>No performance statistics available</Text>
                            ) : (
                                classAverages.map((item, idx) => (
                                    <View key={idx} style={styles.perfRow}>
                                        <Text style={styles.perfLabel}>{item.label}</Text>
                                        <View style={styles.perfBarTrack}>
                                            <View style={[styles.perfBarFill, { width: `${item.val}%`, backgroundColor: item.color }]} />
                                        </View>
                                        <Text style={styles.perfVal}>{item.val}%</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Announcement Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={announceModalVisible}
                onRequestClose={() => setAnnounceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Post Announcement</Text>
                            <TouchableOpacity onPress={() => setAnnounceModalVisible(false)} style={styles.doneBtn}>
                                <Text style={styles.doneText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={styles.modalLabel}>Announcement Title</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter title (e.g. Special Lecture)"
                                value={announceTitle}
                                onChangeText={setAnnounceTitle}
                            />

                            <Text style={styles.modalLabel}>Notice Content</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalTextArea]}
                                placeholder="Write notice details here..."
                                multiline
                                numberOfLines={5}
                                value={announceContent}
                                onChangeText={setAnnounceContent}
                            />

                            <TouchableOpacity
                                style={[styles.submitAnnounceBtn, submittingAnnounce && { opacity: 0.7 }]}
                                onPress={handlePostAnnouncement}
                                disabled={submittingAnnounce}
                            >
                                <LinearGradient
                                    colors={['#2E7D32', '#66BB6A']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.announceBtnGradient}
                                >
                                    <Text style={styles.announceBtnText}>
                                        {submittingAnnounce ? 'Posting...' : 'Post Notice'}
                                    </Text>
                                    {!submittingAnnounce && <FontAwesome name="bullhorn" size={16} color="#fff" style={{ marginLeft: 8 }} />}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
        shadowColor: '#2E7D32',
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
        marginBottom: 25,
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'space-between',
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 15, // Space between stats
        display: 'none', // Removed logic for flex-space-between to work better
    },
    contentBody: {
        paddingHorizontal: 20,
        marginTop: -30,
        paddingTop: 40,
        zIndex: 10,
    },
    // Sections
    sectionContainer: {
        marginBottom: 25,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    seeAllText: {
        color: '#2E7D32',
        fontWeight: '600',
        fontSize: 13,
    },
    // Quick Actions
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        height: 80,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flexShrink: 1,
    },
    // Timeline
    timelineCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timeColumn: {
        alignItems: 'center',
        marginRight: 16,
        width: 65,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        marginBottom: 8,
    },
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 2,
    },
    lineLink: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: -2,
        marginBottom: -24,
        zIndex: 1,
    },
    classInfoCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
    },
    classInfoCardCompleted: {
        backgroundColor: '#F3F4F6',
        borderLeftColor: '#D1D5DB',
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    subjectName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    roomTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roomTagCompleted: {
        backgroundColor: '#E5E7EB',
    },
    roomText: {
        color: '#2E7D32',
        fontSize: 10,
        fontWeight: 'bold',
    },
    textCompleted: {
        color: '#6B7280',
    },
    className: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
    // Performance
    performanceCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    perfRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    perfLabel: {
        width: 70,
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    perfBarTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    perfBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    perfVal: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
        width: 35,
        textAlign: 'right',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    doneBtn: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    doneText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: 'bold',
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#444',
        marginBottom: 8,
        marginTop: 15,
        textTransform: 'uppercase',
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 15,
        color: '#333',
        marginBottom: 10,
    },
    modalTextArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingVertical: 12,
    },
    submitAnnounceBtn: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    announceBtnGradient: {
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    announceBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
