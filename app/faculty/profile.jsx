import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FacultyProfile() {
    const router = useRouter();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/faculty/profile');
            setProfile(res.data);
        } catch (error) {
            console.error('Error loading faculty profile:', error);
            Alert.alert('Error', 'Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleCall = () => {
        if (profile?.phone) {
            Linking.openURL(`tel:${profile.phone}`);
        } else {
            Alert.alert('Not Available', 'Phone number is not configured.');
        }
    };

    const handleEmail = () => {
        if (profile?.user?.email) {
            Linking.openURL(`mailto:${profile.user.email}`);
        } else {
            Alert.alert('Not Available', 'Email is not configured.');
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: logout, style: 'destructive' }
        ]);
    };

    const getInitials = (name) => {
        if (!name) return 'FA';
        const parts = name.replace(/^(Dr\.|Prof\.)\s+/i, '').split(' ');
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatJoiningDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const yearsExp = profile?.joiningDate 
        ? Math.max(1, new Date().getFullYear() - new Date(profile.joiningDate).getFullYear()) 
        : 12;

    if (loading && !profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00695C" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading profile details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Background */}
            <LinearGradient
                colors={['#00695C', '#004D40']}
                style={styles.headerBg}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.duration(800)} style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(profile?.user?.name)}</Text>
                        </View>
                        <View style={styles.statusDot} />
                    </View>

                    <Text style={styles.name}>{profile?.user?.name || 'Faculty'}</Text>
                    <Text style={styles.designation}>{profile?.designation || 'Professor'}</Text>
                    <Text style={styles.dept}>{profile?.department?.name || 'College Faculty'}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                            <MaterialIcons name="call" size={20} color="#fff" />
                            <Text style={styles.actionText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
                            <MaterialIcons name="email" size={20} color="#fff" />
                            <Text style={styles.actionText}>Email</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{yearsExp}</Text>
                        <Text style={styles.statLabel}>Years Exp</Text>
                    </View>
                    <View style={styles.statBorder} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{profile?.subjects?.length || 0}</Text>
                        <Text style={styles.statLabel}>Classes</Text>
                    </View>
                    <View style={styles.statBorder} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>15</Text>
                        <Text style={styles.statLabel}>Papers</Text>
                    </View>
                </View>

                {/* Details Section */}
                <Text style={styles.sectionTitle}>Professional Details</Text>
                <View style={styles.detailsCard}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Employee ID</Text>
                        <Text style={styles.detailValue}>{profile?.employeeId || 'N/A'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Specialization</Text>
                        <Text style={styles.detailValue}>{profile?.specialization || 'N/A'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Joining Date</Text>
                        <Text style={styles.detailValue}>{formatJoiningDate(profile?.joiningDate)}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                    <MaterialIcons name="logout" size={18} color="#D32F2F" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    headerBg: {
        height: 150,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 25,
    },
    avatarContainer: { marginBottom: 15 },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#00695C' },
    statusDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#4CAF50',
        borderWidth: 3,
        borderColor: '#fff',
        position: 'absolute',
        bottom: 5,
        right: 5,
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    designation: { fontSize: 14, color: '#00695C', fontWeight: '600', marginBottom: 2 },
    dept: { fontSize: 13, color: '#777', marginBottom: 20 },

    actionRow: { flexDirection: 'row', gap: 15 },
    actionBtn: {
        flexDirection: 'row',
        backgroundColor: '#00695C',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 3,
    },
    actionText: { color: '#fff', marginLeft: 8, fontWeight: '600' },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        elevation: 2,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statVal: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#777' },
    statBorder: { width: 1, backgroundColor: '#EEE' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginLeft: 5 },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        marginBottom: 30,
    },
    detailItem: { paddingVertical: 5 },
    detailLabel: { fontSize: 12, color: '#888', marginBottom: 3, textTransform: 'uppercase' },
    detailValue: { fontSize: 16, color: '#333', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },

    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFEBEE',
        backgroundColor: '#FFEBEE',
    },
    logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
});
