import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function FacultyUpdates() {
    const { type } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState(type === 'marks' ? 'marks' : 'attendance');

    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [students, setStudents] = useState([]);

    // Input States
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [marksRecords, setMarksRecords] = useState({});
    const [examType, setExamType] = useState('Internal Assessment 1');
    const [maxMarks, setMaxMarks] = useState('100');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [submitting, setSubmitting] = useState(false);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch profile to get subjects
            const profileRes = await api.get('/faculty/profile');
            const profileData = profileRes.data;
            const subjectsList = profileData?.subjects || [];
            setSubjects(subjectsList);
            if (subjectsList.length > 0) {
                setSelectedSubjectId(subjectsList[0]._id);
            }

            // 2. Fetch assigned students
            const studentsRes = await api.get('/faculty/students');
            const studentsList = studentsRes.data || [];
            setStudents(studentsList);

            // 3. Initialize attendance states and marks states
            const initialAttendance = {};
            const initialMarks = {};
            studentsList.forEach(s => {
                initialAttendance[s._id] = 'Present';
                initialMarks[s._id] = '80'; // default seeding score
            });
            setAttendanceRecords(initialAttendance);
            setMarksRecords(initialMarks);
        } catch (error) {
            console.error('Error loading updates config:', error);
            Alert.alert('Error', 'Failed to load configuration data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handleUpload = async () => {
        if (!selectedSubjectId) {
            Alert.alert('Validation Error', 'Please select a subject first.');
            return;
        }

        if (students.length === 0) {
            Alert.alert('Validation Error', 'No students available to mark.');
            return;
        }

        setSubmitting(true);
        try {
            if (activeTab === 'attendance') {
                const payload = {
                    subject: selectedSubjectId,
                    date: new Date().toISOString(),
                    records: students.map(s => ({
                        student: s._id,
                        status: attendanceRecords[s._id] || 'Present'
                    }))
                };
                await api.post('/attendance/bulk', payload);
                Alert.alert('Success', 'Attendance marked successfully.');
            } else {
                if (!examType.trim()) {
                    Alert.alert('Validation Error', 'Please enter an exam title.');
                    setSubmitting(false);
                    return;
                }
                const max = Number(maxMarks);
                if (isNaN(max) || max <= 0) {
                    Alert.alert('Validation Error', 'Please enter a valid max marks number.');
                    setSubmitting(false);
                    return;
                }

                const selectedSubject = subjects.find(sub => sub._id === selectedSubjectId);
                const payload = {
                    subject: selectedSubjectId,
                    examType: examType.trim(),
                    maxMarks: max,
                    semester: selectedSubject?.semester || 5,
                    academicYear: academicYear.trim(),
                    records: students.map(s => {
                        const obtained = Number(marksRecords[s._id] || 0);
                        return {
                            student: s._id,
                            obtainedMarks: obtained
                        };
                    })
                };
                await api.post('/marks/bulk', payload);
                Alert.alert('Success', 'Internal marks uploaded successfully.');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Error', 'Failed to submit updates. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00A86B" />
                <Text style={{ marginTop: 10, color: '#666' }}>Configuring academic portal...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#00A86B', '#00796B']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Academic Updates</Text>
                <Text style={styles.headerSubtitle}>Manage Attendance & Marks</Text>
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
                    onPress={() => setActiveTab('attendance')}
                >
                    <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'marks' && styles.activeTab]}
                    onPress={() => setActiveTab('marks')}
                >
                    <Text style={[styles.tabText, activeTab === 'marks' && styles.activeTabText]}>Internal Marks</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
                    <Text style={styles.label}>Select Subject</Text>
                    <View style={styles.row}>
                        {subjects.length === 0 ? (
                            <Text style={{ color: '#888', fontStyle: 'italic' }}>No assigned subjects</Text>
                        ) : (
                            subjects.map((sub) => (
                                <TouchableOpacity
                                    key={sub._id}
                                    style={[styles.chip, selectedSubjectId === sub._id && styles.activeChip]}
                                    onPress={() => setSelectedSubjectId(sub._id)}
                                >
                                    <Text style={[styles.chipText, selectedSubjectId === sub._id && styles.activeChipText]}>
                                        {sub.code} - Sem {sub.semester}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {activeTab === 'marks' && (
                        <>
                            <Text style={styles.label}>Exam Title</Text>
                            <View style={styles.inputWrapper}>
                                <FontAwesome name="file-text-o" size={16} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Internal Assessment 1"
                                    value={examType}
                                    onChangeText={setExamType}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Max Marks</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="100"
                                            value={maxMarks}
                                            onChangeText={setMaxMarks}
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Academic Year</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="2025-2026"
                                            value={academicYear}
                                            onChangeText={setAcademicYear}
                                        />
                                    </View>
                                </View>
                            </View>
                        </>
                    )}

                    <Text style={styles.label}>Student List ({students.length})</Text>
                    {students.length === 0 ? (
                        <Text style={{ color: '#888', fontStyle: 'italic', paddingVertical: 10 }}>No students in department</Text>
                    ) : (
                        students.map((student) => (
                            <View key={student._id} style={styles.studentItemRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentItemName}>{student.user?.name || 'Student'}</Text>
                                    <Text style={styles.studentItemReg}>{student.registerNumber}</Text>
                                </View>

                                {activeTab === 'attendance' ? (
                                    <View style={styles.attendanceButtonContainer}>
                                        {['Present', 'Absent', 'Late'].map((status) => {
                                            const isSelected = (attendanceRecords[student._id] || 'Present') === status;
                                            let activeBg = '#E8F5E9';
                                            let activeColor = '#00A86B';
                                            if (status === 'Absent') {
                                                activeBg = '#FFEBEE';
                                                activeColor = '#D32F2F';
                                            } else if (status === 'Late') {
                                                activeBg = '#FFF3E0';
                                                activeColor = '#FF8C00';
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={[
                                                        styles.statusBtn,
                                                        isSelected && { backgroundColor: activeBg, borderColor: activeColor }
                                                    ]}
                                                    onPress={() => setAttendanceRecords(prev => ({ ...prev, [student._id]: status }))}
                                                >
                                                    <Text style={[styles.statusBtnText, isSelected && { color: activeColor, fontWeight: 'bold' }]}>
                                                        {status.substring(0, 1)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={styles.marksInputContainer}>
                                        <TextInput
                                            style={styles.marksInput}
                                            keyboardType="numeric"
                                            placeholder="Score"
                                            value={String(marksRecords[student._id] || '')}
                                            onChangeText={(val) => setMarksRecords(prev => ({ ...prev, [student._id]: val }))}
                                        />
                                        <Text style={styles.maxMarksSlash}>/ {maxMarks}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}

                    <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={submitting}>
                        <LinearGradient
                            colors={['#00A86B', '#00796B']}
                            style={styles.gradientBtn}
                        >
                            <Text style={styles.btnText}>
                                {submitting ? 'Uploading...' : activeTab === 'attendance' ? 'Mark Attendance' : 'Upload Marks'}
                            </Text>
                            <MaterialIcons name="cloud-upload" size={20} color="#fff" style={{ marginLeft: 10 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.infoCard}>
                    <FontAwesome name="info-circle" size={20} color="#0056D2" />
                    <Text style={styles.infoText}>
                        Ensure you select the correct subject and verify student entries before uploading.
                    </Text>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
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
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        padding: 4,
        elevation: 2,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#E8F5E9' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
    activeTabText: { color: '#00A86B', fontWeight: 'bold' },

    content: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        marginBottom: 20,
    },
    label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 10, marginTop: 15, textTransform: 'uppercase' },
    row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    activeChip: { backgroundColor: '#00A86B', borderColor: '#00A86B' },
    chipText: { fontSize: 13, color: '#555' },
    activeChipText: { color: '#fff', fontWeight: 'bold' },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 15,
    },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#333' },

    // Student Items styles
    studentItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    studentItemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    studentItemReg: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    attendanceButtonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    statusBtnText: {
        fontSize: 13,
        color: '#555',
    },
    marksInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    marksInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        width: 50,
        height: 36,
        textAlign: 'center',
        fontSize: 14,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    maxMarksSlash: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        width: 45,
    },

    uploadBtn: { marginTop: 25, borderRadius: 12, overflow: 'hidden', elevation: 5 },
    gradientBtn: { paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    infoText: { color: '#0056D2', marginLeft: 10, flex: 1, fontSize: 13, lineHeight: 18 },
});
