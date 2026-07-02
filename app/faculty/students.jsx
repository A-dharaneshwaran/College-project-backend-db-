import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Linking, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function FacultyStudents() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [facultyDept, setFacultyDept] = useState('CSE Department');

    const loadStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            // Fetch profile to get department name
            const facultyRes = await api.get('/faculty/profile');
            const facultyProfile = facultyRes.data;
            if (facultyProfile?.department) {
                setFacultyDept(`${facultyProfile.department.code || 'CSE'} - ${facultyProfile.department.name}`);
            }

            // Fetch assigned students list
            const res = await api.get('/faculty/students');
            const studentsList = res.data || [];
            
            // Map student details and fetch attendance reports in parallel
            const studentsWithAttendance = await Promise.all(
                studentsList.map(async (student) => {
                    let attendanceVal = '100%';
                    try {
                        const attRes = await api.get(`/attendance/student/${student._id}`);
                        if (attRes.data && attRes.data.overall) {
                            attendanceVal = `${attRes.data.overall.percentage}%`;
                        }
                    } catch (attErr) {
                        console.log(`Failed to fetch attendance for student ${student._id}:`, attErr);
                    }
                    return {
                        id: student._id,
                        name: student.user?.name || 'Student',
                        regNo: student.registerNumber,
                        phone: student.parentDetails?.fatherPhone || student.phone || '9876543210',
                        attendance: attendanceVal
                    };
                })
            );
            setStudents(studentsWithAttendance);
        } catch (error) {
            console.error('Error loading students directory:', error);
            Alert.alert('Error', 'Failed to load students directory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudentsAndAttendance();
    }, []);

    const handleCall = (name, phone) => {
        Alert.alert("Call Parent", `Dialing parent of ${name} at ${phone}...`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
        ]);
    };

    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.regNo.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && students.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00A86B" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading student records...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#00A86B', '#00796B']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Student List</Text>
                <Text style={styles.headerSubtitle}>{facultyDept}</Text>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#fff" style={{ opacity: 0.8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search student..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </LinearGradient>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No students found</Text>
                }
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 100)}>
                        <View style={styles.card}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.regNo}>{item.regNo}</Text>
                                <View style={styles.attBadge}>
                                    <Text style={[styles.attText, { color: parseInt(item.attendance) < 75 ? '#D32F2F' : '#2E7D32' }]}>
                                        Att: {item.attendance}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.name, item.phone)}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, marginBottom: 15 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
    },
    searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 15 },

    list: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#00A86B' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    regNo: { fontSize: 12, color: '#666', marginTop: 2 },
    attBadge: {
        backgroundColor: '#f5f5f5',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    attText: { fontSize: 11, fontWeight: 'bold' },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#00A86B',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
});
