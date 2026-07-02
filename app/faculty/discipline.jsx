import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { api } from '../../services/api';

const COMPLAINT_TYPES = [
    { id: 'attendance', name: 'Attendance Violation', color: '#FF9800', bg: '#FFF3E0' },
    { id: 'misconduct', name: 'Misconduct', color: '#F44336', bg: '#FFEBEE' },
    { id: 'ragging', name: 'Ragging', color: '#B71C1C', bg: '#FFCDD2' }, // Severe
    { id: 'illegal', name: 'Illegal Activity', color: '#6A0DAD', bg: '#F3E5F5' },
    { id: 'dishonesty', name: 'Academic Dishonesty', color: '#009688', bg: '#E0F2F1' },
    { id: 'behavior', name: 'Behavior Issue', color: '#E91E63', bg: '#FCE4EC' },
    { id: 'dresscode', name: 'Dress Code', color: '#3F51B5', bg: '#E8EAF6' },
    { id: 'other', name: 'Others', color: '#607D8B', bg: '#ECEFF1' }
];

export default function FacultyDiscipline() {
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedIssues, setSelectedIssues] = useState([]);
    const [description, setDescription] = useState('');
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const profileRes = await api.get('/faculty/profile');
            const deptCode = profileRes.data?.department?.code || 'CSE';

            const studentsRes = await api.get('/faculty/students');
            const studentsList = studentsRes.data || [];

            const formatted = studentsList.map(s => ({
                id: s.registerNumber,
                name: s.user?.name || 'Student',
                dept: deptCode
            }));
            setStudents(formatted);
        } catch (err) {
            console.error('Failed to load students in discipline:', err);
            Alert.alert('Error', 'Failed to load student directory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handlers
    const toggleStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(s => s !== id));
        } else {
            setSelectedStudents(prev => [...prev, id]);
        }
    };

    const toggleIssue = (id) => {
        if (selectedIssues.includes(id)) {
            setSelectedIssues(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIssues(prev => [...prev, id]);
        }
    };

    const getSeverity = (issues) => {
        if (issues.includes('ragging') || issues.includes('illegal')) {
            return 'Critical';
        }
        if (issues.includes('misconduct') || issues.includes('dishonesty') || issues.includes('behavior')) {
            return 'Severe';
        }
        return 'Low';
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0 || selectedIssues.length === 0 || !description.trim()) {
            Alert.alert('Incomplete Report', 'Please select at least one student, one issue, and provide a description.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/discipline', {
                studentRegNumbers: selectedStudents,
                issues: selectedIssues,
                severity: getSeverity(selectedIssues),
                description: description.trim()
            });

            setSuccessMsg(`Successfully reported ${selectedStudents.length} student(s).`);

            // Reset form after delay
            setTimeout(() => {
                setSuccessMsg('');
                setSelectedStudents([]);
                setSelectedIssues([]);
                setDescription('');
            }, 3000);
        } catch (error) {
            console.error('Failed to submit discipline report:', error);
            Alert.alert('Error', 'Failed to submit discipline report.');
        } finally {
            setSubmitting(false);
        }
    };

    const clearAll = () => {
        setSelectedStudents([]);
        setSelectedIssues([]);
        setDescription('');
        setSuccessMsg('');
    };

    const getStudentName = (id) => students.find(s => s.id === id)?.name || id;

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1, paddingVertical: 100 }]}>
                <ActivityIndicator size="large" color="#B71C1C" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading discipline panel...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
                colors={['#C62828', '#B71C1C']}
                style={styles.header}
            >
                <Text style={styles.title}>Disciplinary Action</Text>
                <Text style={styles.subtitle}>Log complaints and misconduct reports</Text>
            </LinearGradient>

            {successMsg ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.successBanner}>
                    <FontAwesome name="check-circle" size={24} color="#fff" />
                    <Text style={styles.successText}>{successMsg}</Text>
                </Animated.View>
            ) : null}

            {/* Form Section */}
            <View style={styles.card}>

                {/* 1. Student Selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderLine}>
                        <Text style={styles.label}>Select Students ({selectedStudents.length})</Text>
                        <TouchableOpacity onPress={clearAll}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.selectorBtn}
                        onPress={() => setStudentModalVisible(true)}
                    >
                        <Text style={styles.selectorBtnText}>
                            {selectedStudents.length > 0
                                ? `${selectedStudents.length} Student(s) Selected`
                                : 'Tap to select students...'}
                        </Text>
                        <FontAwesome name="chevron-down" size={14} color="#666" />
                    </TouchableOpacity>

                    {/* Selected Tags */}
                    {selectedStudents.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {selectedStudents.map(id => (
                                <Animated.View key={id} entering={ZoomIn} exiting={ZoomOut} style={styles.studentTag}>
                                    <Text style={styles.studentTagText}>{getStudentName(id)}</Text>
                                    <TouchableOpacity onPress={() => toggleStudent(id)}>
                                        <FontAwesome name="times" size={12} color="#fff" style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                {/* 2. Issue Categories */}
                <View style={styles.section}>
                    <Text style={styles.label}>Complaint Categories ({selectedIssues.length})</Text>
                    <View style={styles.gridContainer}>
                        {COMPLAINT_TYPES.map((issue) => {
                            const isSelected = selectedIssues.includes(issue.id);
                            return (
                                <TouchableOpacity
                                    key={issue.id}
                                    style={[
                                        styles.checkboxItem,
                                        isSelected && { borderColor: issue.color, backgroundColor: issue.bg }
                                    ]}
                                    onPress={() => toggleIssue(issue.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.checkboxBox,
                                        isSelected ? { backgroundColor: issue.color, borderColor: issue.color } : { borderColor: '#ddd' }
                                    ]}>
                                        {isSelected && <FontAwesome name="check" size={10} color="#fff" />}
                                    </View>
                                    <Text style={[
                                        styles.checkboxLabel,
                                        isSelected && { color: issue.color, fontWeight: 'bold' }
                                    ]}>{issue.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 3. Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Incident Details</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Describe the incident, location, and any witnesses..."
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity onPress={handleSubmit}>
                    <LinearGradient
                        colors={['#D32F2F', '#FF5252']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.submitBtn}
                    >
                        <Text style={styles.submitBtnText}>Submit Complaint</Text>
                        <FontAwesome name="paper-plane" size={16} color="#fff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                </TouchableOpacity>

            </View>

            {/* Student Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={studentModalVisible}
                onRequestClose={() => setStudentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Students</Text>
                            <TouchableOpacity onPress={() => setStudentModalVisible(false)} style={styles.doneBtn}>
                                <Text style={styles.doneText}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={students}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => {
                                const isSelected = selectedStudents.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={[styles.studentRow, isSelected && styles.studentRowSelected]}
                                        onPress={() => toggleStudent(item.id)}
                                    >
                                        <View>
                                            <Text style={[styles.studentName, isSelected && styles.studentNameSelected]}>{item.name}</Text>
                                            <Text style={styles.studentId}>{item.id} • {item.dept}</Text>
                                        </View>
                                        {isSelected ? (
                                            <FontAwesome name="check-circle" size={24} color="#00A86B" />
                                        ) : (
                                            <FontAwesome name="circle-o" size={24} color="#ccc" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    successBanner: {
        backgroundColor: '#00A86B',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#00A86B',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    successText: {
        color: '#fff',
        marginLeft: 10,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 30,
    },
    section: {
        marginBottom: 15,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clearText: {
        color: '#D32F2F',
        fontSize: 12,
        fontWeight: '600',
    },
    selectorBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    selectorBtnText: {
        color: '#444',
        fontSize: 14,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    studentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A237E',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    studentTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    checkboxItem: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 10,
        marginHorizontal: '1.5%',
    },
    checkboxBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 12,
        color: '#555',
        flexShrink: 1,
    },
    textArea: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        padding: 15,
        textAlignVertical: 'top',
        minHeight: 100,
        fontSize: 14,
        color: '#333',
    },
    submitBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 10,
        elevation: 5,
        shadowColor: '#D32F2F',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    divider: {
        color: '#F0F0F0',
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 20,
    },
    // Modal
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
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    studentRowSelected: {
        backgroundColor: '#F1F8E9',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    studentName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    studentNameSelected: {
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    studentId: {
        fontSize: 12,
        color: '#888',
    },
});
