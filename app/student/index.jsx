import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

const ScaleButton = ({ children, style, onPress }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => scale.value = withSpring(0.95)}
            onPressOut={() => scale.value = withSpring(1)}
            style={({ pressed }) => [style, Platform.OS === 'web' && { cursor: 'pointer' }]}
        >
            <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [marks, setMarks] = useState([]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [statsRes, annRes, marksRes] = await Promise.all([
                api.get('/students/profile/dashboard'),
                api.get('/announcements/active'),
                api.get('/marks/my')
            ]);

            setDashboardStats(statsRes.data);

            // Map Announcements to Events UI structure
            const COLORS = ['#FF8C00', '#0056D2', '#D32F2F', '#4CAF50', '#8E24AA'];
            const ICONS = ['bullhorn', 'info-circle', 'calendar', 'exclamation-circle'];
            
            const announcementsData = annRes.data || [];
            const mappedEvents = announcementsData.map((ann, index) => {
                const dateObj = new Date(ann.createdAt);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[dateObj.getMonth()];
                return {
                    title: ann.title,
                    date: `${day} ${month}`,
                    color: COLORS[index % COLORS.length],
                    icon: ICONS[index % ICONS.length]
                };
            });
            setEvents(mappedEvents);

            // Map Marks to Chart UI structure
            const CHART_COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EF5350', '#26C6DA'];
            const marksData = marksRes.data?.marks || [];
            
            // Group by subject and get average obtainedMarks
            const subjectAverages = {};
            marksData.forEach((m) => {
                if (m.subject) {
                    const code = m.subject.code;
                    if (!subjectAverages[code]) {
                        subjectAverages[code] = { total: 0, count: 0 };
                    }
                    subjectAverages[code].total += (m.obtainedMarks / m.maxMarks) * 100;
                    subjectAverages[code].count += 1;
                }
            });

            const mappedMarks = Object.keys(subjectAverages).slice(0, 5).map((code, index) => {
                const avg = Math.round(subjectAverages[code].total / subjectAverages[code].count);
                return {
                    subject: code,
                    score: avg,
                    color: CHART_COLORS[index % CHART_COLORS.length]
                };
            });
            setMarks(mappedMarks);

        } catch (err) {
            console.error('Error loading student dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: logout, style: 'destructive' }
        ]);
    };

    const quickActions = [
        { title: 'Academics', icon: 'graduation-cap', route: '/student/academics', color: '#0056D2', bg: '#E3F2FD' },
        { title: 'Discipline', icon: 'gavel', route: '/student/discipline', color: '#D32F2F', bg: '#FFEBEE' },
        { title: 'Timetable', icon: 'calendar', route: null, color: '#00A86B', bg: '#E8F5E9', action: () => Alert.alert('Timetable', 'Showing Weekly Schedule...') },
        { title: 'Queries', icon: 'question-circle', route: '/student/query', color: '#FF8C00', bg: '#FFF3E0' },
        { title: 'Achievements', icon: 'trophy', route: '/student/achievements', color: '#FFD700', bg: '#FFF8E1' },
        { title: 'Contact', icon: 'phone', route: null, color: '#6A0DAD', bg: '#F3E5F5', action: () => Alert.alert('Faculty Advisor', 'Connecting...') },
        { title: 'Profile', icon: 'user', route: '/student/profile', color: '#455A64', bg: '#ECEFF1' },
        { title: 'Messages', icon: 'comments', route: '/student/messages', color: '#1a237e', bg: '#E8EAF6' },
    ];

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0056D2" />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <FontAwesome name="exclamation-triangle" size={40} color="#D32F2F" style={{ marginBottom: 15 }} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Header Profile Card */}
            <LinearGradient
                colors={['#0056D2', '#003c8f']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.welcomeLabel}>Welcome Back,</Text>
                        <Text style={styles.userName}>{user?.name || 'Student Name'}</Text>
                        <Text style={styles.userDept}>
                            {user?.details?.department?.code || 'B.E. CSE'} | Semester {user?.details?.semester || '5'}
                        </Text>
                    </View>
                    <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                        <MaterialIcons name="logout" size={20} color="#fff" />
                    </Pressable>
                </View>

                {/* Attendance & Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.attendanceContainer}>
                        <View style={styles.circleOuter}>
                            <LinearGradient
                                colors={['#00A86B', '#66BB6A']}
                                style={styles.circleGradient}
                            >
                                <View style={styles.circleInner}>
                                    <Text style={styles.attendancePercent}>
                                        {dashboardStats?.attendance?.percentage || '100'}%
                                    </Text>
                                    <Text style={styles.attendanceLabel}>Present</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.statsCol}>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>
                                {dashboardStats?.academics?.cgpa || '8.5'}
                            </Text>
                            <Text style={styles.statLbl}>CGPA</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>
                                {dashboardStats?.academics?.backlogs ?? '0'}
                            </Text>
                            <Text style={styles.statLbl}>Backlogs</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Dashboard</Text>
                <View style={styles.actionGrid}>
                    {quickActions.map((item, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.delay(index * 100).springify()}
                            style={styles.actionCardWrapper}
                        >
                            <ScaleButton
                                onPress={() => item.route ? router.push(item.route) : item.action?.()}
                                style={[styles.actionCard, { backgroundColor: '#fff' }]}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                                    <FontAwesome name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={styles.actionText}>{item.title}</Text>
                            </ScaleButton>
                        </Animated.View>
                    ))}
                </View>

                {/* Performance Chart */}
                <Text style={styles.sectionTitle}>Performance Overview</Text>
                <View style={styles.chartCard}>
                    {marks.length === 0 ? (
                        <View style={styles.centerContainerMini}>
                            <Text style={styles.emptyTextMini}>No marks reports uploaded yet</Text>
                        </View>
                    ) : (
                        <View style={styles.chartContainer}>
                            {marks.map((item, index) => (
                                <View key={index} style={styles.barCol}>
                                    <View style={styles.barTrack}>
                                        <LinearGradient
                                            colors={[item.color, item.color + '80']}
                                            style={[styles.barFill, { height: `${item.score}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.barLabel}>{item.subject}</Text>
                                    <Text style={styles.barScore}>{item.score}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Upcoming Events */}
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {events.length === 0 ? (
                    <View style={styles.emptyEventsCard}>
                        <Text style={styles.emptyText}>No upcoming events or announcements</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
                        {events.map((event, index) => (
                            <Animated.View key={index} entering={FadeInDown.delay(index * 150)}>
                                <ScaleButton style={[styles.eventCard, { borderLeftColor: event.color }]}>
                                    <View style={styles.eventRow}>
                                        <View style={[styles.eventDateBox, { backgroundColor: event.color + '15' }]}>
                                            <Text style={[styles.eventDateText, { color: event.color }]}>
                                                {event.date.split(' ')[0]}
                                            </Text>
                                            <Text style={[styles.eventMonthText, { color: event.color }]}>
                                                {event.date.split(' ')[1]}
                                            </Text>
                                        </View>
                                        <View style={styles.eventInfo}>
                                            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                                            <View style={styles.eventTag}>
                                                <FontAwesome name={event.icon} size={10} color="#666" style={{ marginRight: 4 }} />
                                                <Text style={styles.eventTagText}>Campus</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScaleButton>
                            </Animated.View>
                        ))}
                    </ScrollView>
                )}

                <View style={{ height: 80 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerCard: {
        paddingTop: Platform.OS === 'android' ? 60 : 30,
        paddingBottom: 40, // Extended background
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#0056D2',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    attendanceContainer: {
        alignItems: 'center',
    },
    circleOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    circleGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    circleInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff', // White center
        justifyContent: 'center',
        alignItems: 'center',
    },
    attendancePercent: {
        color: '#00A86B',
        fontSize: 22,
        fontWeight: '900',
    },
    attendanceLabel: {
        color: '#666',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statsCol: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    statVal: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    statLbl: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginTop: 2,
    },
    contentContainer: {
        paddingHorizontal: 20,
        marginTop: -30, // Pull up to overlap
        paddingTop: 40, // Push content down to avoid collision
        zIndex: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 4,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionCardWrapper: {
        width: '48%',
        marginBottom: 15,
    },
    actionCard: {
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 14,
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
    chartCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 160,
    },
    barCol: {
        alignItems: 'center',
        width: '15%',
    },
    barTrack: {
        width: 10,
        height: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 5,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: 8,
    },
    barFill: {
        width: '100%',
        borderRadius: 5,
    },
    barLabel: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
        marginBottom: 2,
    },
    barScore: {
        fontSize: 11,
        color: '#333',
        fontWeight: 'bold',
    },
    eventScroll: {
        marginBottom: 20,
    },
    eventCard: {
        backgroundColor: '#fff',
        width: 220,
        padding: 15,
        borderRadius: 16,
        marginRight: 15,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 10, // Shadow room
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventDateBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    eventDateText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventMonthText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    eventTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    eventTagText: {
        fontSize: 10,
        color: '#666',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
        textAlign: 'center',
        marginHorizontal: 20,
        marginBottom: 15,
    },
    retryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#0056D2',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyEventsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
    },
    centerContainerMini: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        width: '100%',
    },
    emptyTextMini: {
        color: '#888',
        fontSize: 12,
    },
});
