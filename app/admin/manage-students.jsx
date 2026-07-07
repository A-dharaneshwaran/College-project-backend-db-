import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSearch from '../../hooks/useSearch';
import {
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api, API_URL, getAuthToken } from '../../services/api';

export default function ManageStudents() {
    // ── Server-side search & filter (replaces all client-side filtering) ──────
    const {
        query: searchQuery,
        data: students,
        pagination,
        loading: searchLoading,
        error: searchError,
        isEmpty,
        updateQuery: setSearchQuery,
        updateFilter,
        setAllFilters,
        filters: activeFilters,
        page,
        nextPage,
        prevPage,
        retry,
        reset: resetSearch,
    } = useSearch('/search/students', { department: '', year: '', semester: '', gender: '' }, { defaultLimit: 20 });

    const [departments, setDepartments] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterMeta, setFilterMeta] = useState({ years: [], semesters: [], genders: [] });

    // Search debounce ref (not needed — useSearch handles it internally)

    // Modals
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // Bulk Import state
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importPreviewVisible, setImportPreviewVisible] = useState(false);
    const [importProgressVisible, setImportProgressVisible] = useState(false);
    const [importReportVisible, setImportReportVisible] = useState(false);
    const [importMode, setImportMode] = useState('create_only');
    const [importPreview, setImportPreview] = useState(null);
    const [importReport, setImportReport] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importedCredentials, setImportedCredentials] = useState([]);
    const [credentialsDownloadId, setCredentialsDownloadId] = useState('');
    const fileInputRef = useRef(null);

    // Bulk Export state
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [exportDept, setExportDept] = useState('');
    const [exportSemester, setExportSemester] = useState('');
    const [exportYear, setExportYear] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    // Form fields for registration
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('Student@123');
    const [formRegNo, setFormRegNo] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formDob, setFormDob] = useState('2004-01-01');
    const [formGender, setFormGender] = useState('Male');
    const [formDept, setFormDept] = useState('');
    const [formYear, setFormYear] = useState(3);
    const [formSem, setFormSem] = useState(5);
    const [formFatherName, setFormFatherName] = useState('');
    const [formFatherPhone, setFormFatherPhone] = useState('');
    const [formMotherName, setFormMotherName] = useState('');
    const [formMotherPhone, setFormMotherPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load departments and filter metadata on mount
    const loadDepartmentsAndMeta = async () => {
        try {
            const [deptsRes, metaRes] = await Promise.all([
                api.get('/departments'),
                api.get('/search/meta/students'),
            ]);
            const deptsList = deptsRes.data?.data || [];
            setDepartments(deptsList);
            if (deptsList.length > 0) setFormDept(deptsList[0]._id);
            setFilterMeta(metaRes.data || { years: [], semesters: [], genders: [] });
        } catch (error) {
            console.error('Error loading departments/meta:', error);
        }
    };

    // After import/create — refresh the list by resetting search
    const loadStudentsAndDepts = useCallback(() => {
        loadDepartmentsAndMeta();
        resetSearch();
    }, [resetSearch]);

    useEffect(() => {
        loadDepartmentsAndMeta();
    }, []);
    const handleCall = (phoneNumber) => Linking.openURL(`tel:${phoneNumber}`);
    const handleSMS = (phoneNumber) => Linking.openURL(`sms:${phoneNumber}`);
    const handleEmail = (email) => Linking.openURL(`mailto:${email}`);

    const viewStudentDetails = (student) => {
        setSelectedStudent(student);
        setDetailsModalVisible(true);
    };

    const handleDeleteStudent = (student) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${student.user?.name || 'this student'}? This will delete their login credentials and all marks/attendance records permanently.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/students/${student._id}`);
                            Alert.alert('Success', 'Student record deleted successfully.');
                            setDetailsModalVisible(false);
                            loadStudentsAndDepts();
                        } catch (err) {
                            console.error('Delete failed:', err);
                            Alert.alert('Error', 'Failed to delete student.');
                        }
                    }
                }
            ]
        );
    };

    const handleRegister = async () => {
        if (!formName.trim() || !formEmail.trim() || !formRegNo.trim() || !formPhone.trim() || !formDept) {
            Alert.alert('Validation Error', 'Please fill in Name, Email, Register No, Phone and Department.');
            return;
        }

        if (!formFatherName.trim() || !formFatherPhone.trim() || !formMotherName.trim() || !formMotherPhone.trim()) {
            Alert.alert('Validation Error', 'Please fill in both parent details.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formName.trim(),
                email: formEmail.trim().toLowerCase(),
                password: formPassword,
                role: 'student',
                registerNumber: formRegNo.trim().toUpperCase(),
                phone: formPhone.trim(),
                dateOfBirth: new Date(formDob).toISOString(),
                gender: formGender,
                department: formDept,
                year: Number(formYear),
                semester: Number(formSem),
                parentDetails: {
                    fatherName: formFatherName.trim(),
                    fatherPhone: formFatherPhone.trim(),
                    motherName: formMotherName.trim(),
                    motherPhone: formMotherPhone.trim()
                }
            };
            await api.post('/auth/register', payload);
            Alert.alert('Success', 'Student registered successfully.');
            setCreateModalVisible(false);
            
            // Clear fields
            setFormName('');
            setFormEmail('');
            setFormRegNo('');
            setFormPhone('');
            setFormFatherName('');
            setFormFatherPhone('');
            setFormMotherName('');
            setFormMotherPhone('');

            loadStudentsAndDepts();
        } catch (err) {
            console.error('Registration failed:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to register student.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Bulk Import Handlers ─────────────────────────────────────────────────

    const handleFileSelected = async (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'csv', 'xls'].includes(ext)) {
            Alert.alert('Invalid File', 'Please select an .xlsx or .csv file.');
            return;
        }
        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.upload('/bulk/students/import', formData, `?preview=true&mode=${importMode}`);
            setImportPreview(res.data);
            setImportModalVisible(false);
            setImportPreviewVisible(true);
        } catch (err) {
            Alert.alert('Parse Error', err.message || 'Failed to read file.');
        } finally {
            setImportLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        setImportPreviewVisible(false);
        setImportProgressVisible(true);
        try {
            const token = await (await import('../../services/api')).getAuthToken();
            // We re-upload the file stored on the web input
            const file = fileInputRef.current?.files?.[0];
            if (!file) throw new Error('File reference lost. Please re-upload.');

            const formData = new FormData();
            formData.append('file', file);
            const res = await api.upload('/bulk/students/import', formData, `?mode=${importMode}`);
            setImportReport(res.data);
            setImportedCredentials(res.data?.importedRecords || []);
            setCredentialsDownloadId(res.data?.credentialsDownloadId || '');
            setImportProgressVisible(false);
            setImportReportVisible(true);
            loadStudentsAndDepts();
        } catch (err) {
            setImportProgressVisible(false);
            Alert.alert('Import Failed', err.message || 'Import failed.');
        }
    };

    const handleDownloadCredentials = async () => {
        if (!credentialsDownloadId) {
            Alert.alert('No Credentials', 'No new accounts were created in this import.');
            return;
        }
        try {
            const res = await api.post('/bulk/students/credentials', { downloadId: credentialsDownloadId });
            // For web: use download API
            const dlRes = await api.download('/bulk/students/credentials', '');
        } catch {}
        // Direct approach for web — rebuild the xlsx client-side via blob POST
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/bulk/students/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ downloadId: credentialsDownloadId }),
        });
        if (!response.ok) { Alert.alert('Error', 'Failed to generate credentials file.'); return; }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_credentials.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Download Template ────────────────────────────────────────────────────

    const handleDownloadTemplate = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/bulk/students/template`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Template download failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to download template.');
        }
    };

    // ── Bulk Export ──────────────────────────────────────────────────────────

    const handleExportStudents = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({ format: exportFormat });
            if (exportDept) params.append('dept', exportDept);
            if (exportSemester) params.append('semester', exportSemester);
            if (exportYear) params.append('year', exportYear);

            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/bulk/students/export?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const cd = response.headers.get('Content-Disposition') || '';
            const fname = cd.split('filename=')[1]?.replace(/"/g, '') || `students_export.${exportFormat}`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fname;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportModalVisible(false);
        } catch (err) {
            Alert.alert('Export Failed', err.message || 'Failed to export students.');
        } finally {
            setExportLoading(false);
        }
    };

    if (searchLoading && students.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#D32F2F" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading student profiles...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <LinearGradient
                colors={['#C62828', '#D32F2F']} // Admin Red
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Student Management</Text>
                        <Text style={styles.headerSubtitle}>View & Contact Students</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={handleDownloadTemplate}>
                            <Ionicons name="document-outline" size={20} color="#fff" />
                            <Text style={styles.headerIconLabel}>Template</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setImportModalVisible(true)}>
                            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                            <Text style={styles.headerIconLabel}>Import</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setExportModalVisible(true)}>
                            <Ionicons name="cloud-download-outline" size={20} color="#fff" />
                            <Text style={styles.headerIconLabel}>Export</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Ionicons name="add-circle" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Name, register number, email..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                        id="student-search-input"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                            <Ionicons name="close-circle" size={18} color="#ccc" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.filterToggleBtn, showAdvancedFilters && styles.filterToggleBtnActive]}
                        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                        <Ionicons name="options-outline" size={18} color={showAdvancedFilters ? '#C62828' : '#666'} />
                        {(activeFilters.department || activeFilters.year || activeFilters.semester || activeFilters.gender) && (
                            <View style={styles.filterDot} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <View style={styles.advancedFiltersPanel}>
                        {/* Department filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                            <TouchableOpacity
                                style={[styles.filterChip, !activeFilters.department && styles.filterChipActive]}
                                onPress={() => updateFilter('department', '')}
                            >
                                <Text style={[styles.filterChipText, !activeFilters.department && styles.filterChipTextActive]}>All Depts</Text>
                            </TouchableOpacity>
                            {departments.map(d => (
                                <TouchableOpacity
                                    key={d._id}
                                    style={[styles.filterChip, activeFilters.department === d._id && styles.filterChipActive]}
                                    onPress={() => updateFilter('department', activeFilters.department === d._id ? '' : d._id)}
                                >
                                    <Text style={[styles.filterChipText, activeFilters.department === d._id && styles.filterChipTextActive]}>{d.code}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Year filter */}
                        <View style={styles.filterRow}>
                            <Text style={styles.filterRowLabel}>Year:</Text>
                            {(filterMeta.years.length > 0 ? filterMeta.years : [1, 2, 3, 4]).map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.filterChipSm, activeFilters.year === String(y) && styles.filterChipActive]}
                                    onPress={() => updateFilter('year', activeFilters.year === String(y) ? '' : String(y))}
                                >
                                    <Text style={[styles.filterChipText, activeFilters.year === String(y) && styles.filterChipTextActive]}>Y{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Semester filter */}
                        <View style={styles.filterRow}>
                            <Text style={styles.filterRowLabel}>Sem:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                {(filterMeta.semesters.length > 0 ? filterMeta.semesters : [1,2,3,4,5,6,7,8]).map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.filterChipSm, activeFilters.semester === String(s) && styles.filterChipActive]}
                                        onPress={() => updateFilter('semester', activeFilters.semester === String(s) ? '' : String(s))}
                                    >
                                        <Text style={[styles.filterChipText, activeFilters.semester === String(s) && styles.filterChipTextActive]}>S{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Gender filter */}
                        <View style={styles.filterRow}>
                            <Text style={styles.filterRowLabel}>Gender:</Text>
                            {(filterMeta.genders.length > 0 ? filterMeta.genders : ['Male', 'Female', 'Other']).map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.filterChipSm, activeFilters.gender === g && styles.filterChipActive]}
                                    onPress={() => updateFilter('gender', activeFilters.gender === g ? '' : g)}
                                >
                                    <Text style={[styles.filterChipText, activeFilters.gender === g && styles.filterChipTextActive]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                            {(activeFilters.department || activeFilters.year || activeFilters.semester || activeFilters.gender) && (
                                <TouchableOpacity
                                    style={[styles.filterChipSm, { borderColor: '#EF5350' }]}
                                    onPress={() => setAllFilters({ department: '', year: '', semester: '', gender: '' })}
                                >
                                    <Text style={[styles.filterChipText, { color: '#EF5350' }]}>Clear</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

            </LinearGradient>

            {/* Record count bar */}
            {!searchLoading && (
                <View style={styles.recordCountBar}>
                    <Text style={styles.recordCountText}>
                        {pagination.total} student{pagination.total !== 1 ? 's' : ''}
                        {pagination.pages > 1 ? ` · Page ${pagination.page} of ${pagination.pages}` : ''}
                    </Text>
                    {searchLoading && <ActivityIndicator size="small" color="#C62828" />}
                </View>
            )}

            {/* Student List */}
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {/* Loading state */}
                {searchLoading && students.length === 0 && (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator size="large" color="#D32F2F" />
                        <Text style={styles.stateText}>Searching students...</Text>
                    </View>
                )}

                {/* Error state */}
                {searchError && !searchLoading && (
                    <View style={styles.stateContainer}>
                        <Ionicons name="wifi-outline" size={40} color="#EF5350" />
                        <Text style={styles.stateTitle}>Search Failed</Text>
                        <Text style={styles.stateText}>{searchError}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={retry}>
                            <Ionicons name="refresh" size={16} color="#fff" />
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Empty state */}
                {isEmpty && !searchError && (
                    <View style={styles.stateContainer}>
                        <Ionicons name="school-outline" size={48} color="#BDBDBD" />
                        <Text style={styles.stateTitle}>No Students Found</Text>
                        <Text style={styles.stateText}>
                            {searchQuery || Object.values(activeFilters).some(Boolean)
                                ? 'No students match your search or filters.'
                                : 'No students have been registered yet.'}
                        </Text>
                        {(searchQuery || Object.values(activeFilters).some(Boolean)) && (
                            <TouchableOpacity style={styles.clearFiltersBtn} onPress={() => { setSearchQuery(''); setAllFilters({ department: '', year: '', semester: '', gender: '' }); }}>
                                <Text style={styles.clearFiltersBtnText}>Clear Search & Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Results */}
                {students.map((student, index) => (
                    <Animated.View key={student._id} entering={FadeInDown.delay(index * 60).springify()}>
                        <Pressable
                            style={styles.studentCard}
                            onPress={() => viewStudentDetails(student)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    <Text style={styles.avatarText}>{(student.user?.name || 'S').charAt(0)}</Text>
                                </View>
                                <View style={styles.headerInfo}>
                                    <Text style={styles.studentName}>{student.user?.name || 'Student'}</Text>
                                    <Text style={styles.studentReg}>{student.registerNumber}</Text>
                                </View>
                                <View style={styles.deptBadge}>
                                    <Text style={styles.deptText}>
                                        {(student.department?.code || 'CSE').substring(0, 3).toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.contactRow}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => handleCall(student.phone)}>
                                    <Ionicons name="call" size={18} color="#2E7D32" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]} onPress={() => handleSMS(student.phone)}>
                                    <Ionicons name="chatbubble" size={18} color="#1565C0" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]} onPress={() => handleEmail(student.user?.email)}>
                                    <Ionicons name="mail" size={18} color="#EF6C00" />
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Animated.View>
                ))}

                {/* Inline loading indicator while paginating */}
                {searchLoading && students.length > 0 && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#C62828" />
                    </View>
                )}

                {/* Pagination controls */}
                {pagination.pages > 1 && !searchLoading && (
                    <View style={styles.paginationRow}>
                        <TouchableOpacity
                            style={[styles.pageBtn, !pagination.hasPrev && styles.pageBtnDisabled]}
                            onPress={prevPage}
                            disabled={!pagination.hasPrev}
                        >
                            <Ionicons name="chevron-back" size={18} color={pagination.hasPrev ? '#C62828' : '#ccc'} />
                            <Text style={[styles.pageBtnText, !pagination.hasPrev && { color: '#ccc' }]}>Prev</Text>
                        </TouchableOpacity>
                        <Text style={styles.pageIndicator}>{pagination.page} / {pagination.pages}</Text>
                        <TouchableOpacity
                            style={[styles.pageBtn, !pagination.hasNext && styles.pageBtnDisabled]}
                            onPress={nextPage}
                            disabled={!pagination.hasNext}
                        >
                            <Text style={[styles.pageBtnText, !pagination.hasNext && { color: '#ccc' }]}>Next</Text>
                            <Ionicons name="chevron-forward" size={18} color={pagination.hasNext ? '#C62828' : '#ccc'} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Student Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Profile</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedStudent && (
                                <>
                                    <View style={styles.profileHeader}>
                                        <View style={styles.largeAvatar}>
                                            <Text style={styles.largeAvatarText}>{(selectedStudent.user?.name || 'S').charAt(0)}</Text>
                                        </View>
                                        <Text style={styles.profileName}>{selectedStudent.user?.name || 'Student'}</Text>
                                        <Text style={styles.profileReg}>{selectedStudent.registerNumber}</Text>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Academic Info</Text>
                                        <InfoRow label="Department" value={selectedStudent.department?.name || 'N/A'} />
                                        <InfoRow label="Year/Sem" value={`Year ${selectedStudent.year} / Sem ${selectedStudent.semester}`} />
                                        <InfoRow label="Admission" value={selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : 'N/A'} />
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Personal Details</Text>
                                        <InfoRow label="Email" value={selectedStudent.user?.email || 'N/A'} />
                                        <InfoRow label="Phone" value={selectedStudent.phone || 'N/A'} />
                                        <InfoRow label="Gender" value={selectedStudent.gender || 'N/A'} />
                                        <InfoRow label="Address" value={`${selectedStudent.address || ''}, ${selectedStudent.city || ''}, ${selectedStudent.state || ''}`} />
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Parent Contact</Text>

                                        <View style={styles.parentCard}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.parentLabel}>Father</Text>
                                                <Text style={styles.parentName}>{selectedStudent.parentDetails?.fatherName || 'N/A'}</Text>
                                                <Text style={styles.parentPhone}>{selectedStudent.parentDetails?.fatherPhone || 'N/A'}</Text>
                                            </View>
                                            <TouchableOpacity style={styles.callRoundBtn} onPress={() => handleCall(selectedStudent.parentDetails?.fatherPhone)}>
                                                <Ionicons name="call" size={18} color="#fff" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={[styles.parentCard, { marginTop: 10 }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.parentLabel}>Mother</Text>
                                                <Text style={styles.parentName}>{selectedStudent.parentDetails?.motherName || 'N/A'}</Text>
                                                <Text style={styles.parentPhone}>{selectedStudent.parentDetails?.motherPhone || 'N/A'}</Text>
                                            </View>
                                            <TouchableOpacity style={styles.callRoundBtn} onPress={() => handleCall(selectedStudent.parentDetails?.motherPhone)}>
                                                <Ionicons name="call" size={18} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.deleteStudentBtn}
                                        onPress={() => handleDeleteStudent(selectedStudent)}
                                    >
                                        <Text style={styles.deleteStudentText}>Delete Student</Text>
                                        <Ionicons name="trash-outline" size={16} color="#D32F2F" style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                </>
                            )}
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Create Student Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Register Student</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                            <Text style={styles.formLabel}>Full Name</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Enter full name"
                                value={formName}
                                onChangeText={setFormName}
                            />

                            <Text style={styles.formLabel}>Email Address</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Enter email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formEmail}
                                onChangeText={setFormEmail}
                            />

                            <Text style={styles.formLabel}>Register Number</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. 722821104002"
                                autoCapitalize="characters"
                                value={formRegNo}
                                onChangeText={setFormRegNo}
                            />

                            <Text style={styles.formLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. +91 9876543210"
                                value={formPhone}
                                onChangeText={setFormPhone}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formLabel}>Gender</Text>
                                    <View style={styles.genderRow}>
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.genderChip, formGender === g && styles.activeGenderChip]}
                                                onPress={() => setFormGender(g)}
                                            >
                                                <Text style={[styles.genderChipText, formGender === g && styles.activeGenderChipText]}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.formLabel}>Department</Text>
                            <View style={styles.formSelectorContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 5 }}>
                                    {departments.map((dept) => (
                                        <TouchableOpacity
                                            key={dept._id}
                                            style={[styles.deptChip, formDept === dept._id && styles.activeDeptChip]}
                                            onPress={() => setFormDept(dept._id)}
                                        >
                                            <Text style={[styles.deptChipText, formDept === dept._id && styles.activeDeptChipText]}>
                                                {dept.code}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formLabel}>Year</Text>
                                    <View style={{ flexDirection: 'row', gap: 5 }}>
                                        {[1, 2, 3, 4].map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                style={[styles.numChip, formYear === y && styles.activeNumChip]}
                                                onPress={() => setFormYear(y)}
                                            >
                                                <Text style={[styles.numChipText, formYear === y && styles.activeNumChipText]}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={{ flex: 1.2 }}>
                                    <Text style={styles.formLabel}>Semester</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.numChip, formSem === s && styles.activeNumChip]}
                                                onPress={() => setFormSem(s)}
                                            >
                                                <Text style={[styles.numChipText, formSem === s && styles.activeNumChipText]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <Text style={styles.formLabel}>Date of Birth (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="2004-01-01"
                                value={formDob}
                                onChangeText={setFormDob}
                            />

                            <Text style={styles.sectionSubtitleHeader}>Parent Details</Text>

                            <Text style={styles.formLabel}>Father Name</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Father's full name"
                                value={formFatherName}
                                onChangeText={setFormFatherName}
                            />
                            <Text style={styles.formLabel}>Father Phone</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Father's phone"
                                value={formFatherPhone}
                                onChangeText={setFormFatherPhone}
                            />

                            <Text style={styles.formLabel}>Mother Name</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Mother's full name"
                                value={formMotherName}
                                onChangeText={setFormMotherName}
                            />
                            <Text style={styles.formLabel}>Mother Phone</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Mother's phone"
                                value={formMotherPhone}
                                onChangeText={setFormMotherPhone}
                            />

                            <TouchableOpacity
                                style={[styles.submitRegisterBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={submitting}
                            >
                                <LinearGradient
                                    colors={['#C62828', '#D32F2F']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.registerBtnGradient}
                                >
                                    <Text style={styles.registerBtnText}>
                                        {submitting ? 'Registering Student...' : 'Register Student'}
                                    </Text>
                                    {!submitting && <Ionicons name="person-add" size={18} color="#fff" style={{ marginLeft: 8 }} />}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Import File Picker Modal ────────────────────────────── */}
            <Modal animationType="slide" transparent visible={importModalVisible} onRequestClose={() => setImportModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Import Students</Text>
                            <TouchableOpacity onPress={() => setImportModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formLabel}>Import Mode</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                            {[
                                { key: 'create_only', label: 'Create Only' },
                                { key: 'update_only', label: 'Update Only' },
                                { key: 'create_update', label: 'Create + Update' },
                            ].map(m => (
                                <TouchableOpacity
                                    key={m.key}
                                    style={[styles.modeChip, importMode === m.key && styles.activeModeChip]}
                                    onPress={() => setImportMode(m.key)}
                                >
                                    <Text style={[styles.modeChipText, importMode === m.key && styles.activeModeChipText]}>{m.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.uploadZone}>
                            <Ionicons name="cloud-upload-outline" size={48} color="#D32F2F" />
                            <Text style={styles.uploadTitle}>Select Excel or CSV File</Text>
                            <Text style={styles.uploadSubtitle}>Supports .xlsx and .csv formats</Text>
                            {importLoading ? (
                                <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
                            ) : (
                                <TouchableOpacity
                                    style={styles.selectFileBtn}
                                    onPress={() => fileInputRef.current?.click()}
                                >
                                    <Ionicons name="folder-open-outline" size={18} color="#fff" />
                                    <Text style={styles.selectFileBtnText}>Browse File</Text>
                                </TouchableOpacity>
                            )}
                            {Platform.OS === 'web' && (
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.csv,.xls"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                                />
                            )}
                        </View>

                        <TouchableOpacity style={styles.templateHintBtn} onPress={handleDownloadTemplate}>
                            <Ionicons name="download-outline" size={16} color="#D32F2F" />
                            <Text style={styles.templateHintText}>Download Template First</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Import Preview Modal ────────────────────────────────── */}
            <Modal animationType="slide" transparent visible={importPreviewVisible} onRequestClose={() => setImportPreviewVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Import Preview</Text>
                            <TouchableOpacity onPress={() => setImportPreviewVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {importPreview && (
                                <>
                                    <View style={styles.previewStatsRow}>
                                        <View style={[styles.previewStat, { backgroundColor: '#E8F5E9' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#2E7D32' }]}>{importPreview.total}</Text>
                                            <Text style={styles.previewStatLabel}>Total Rows</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#E3F2FD' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#1565C0' }]}>{importPreview.toCreate}</Text>
                                            <Text style={styles.previewStatLabel}>To Create</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#FFF3E0' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#E65100' }]}>{importPreview.duplicates}</Text>
                                            <Text style={styles.previewStatLabel}>Duplicates</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#FFEBEE' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#C62828' }]}>{importPreview.invalid}</Text>
                                            <Text style={styles.previewStatLabel}>Invalid</Text>
                                        </View>
                                    </View>

                                    {importPreview.invalidRows?.length > 0 && (
                                        <>
                                            <Text style={styles.errorSectionTitle}>⚠️ Invalid Rows (will be skipped)</Text>
                                            {importPreview.invalidRows.map((r, i) => (
                                                <View key={i} style={styles.errorRow}>
                                                    <Text style={styles.errorRowNum}>Row {r.rowNum}:</Text>
                                                    <Text style={styles.errorRowText}>{r.errors.join(' • ')}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}

                                    {importPreview.duplicateRows?.length > 0 && (
                                        <>
                                            <Text style={[styles.errorSectionTitle, { color: '#E65100' }]}>⚠️ Existing Records (duplicates)</Text>
                                            {importPreview.duplicateRows.slice(0, 10).map((r, i) => (
                                                <View key={i} style={[styles.errorRow, { backgroundColor: '#FFF8E1' }]}>
                                                    <Text style={styles.errorRowNum}>Row {r.rowNum}:</Text>
                                                    <Text style={styles.errorRowText}>{r.row.registerNumber} — {r.row.email}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}

                                    {importPreview.toCreate === 0 && importPreview.toUpdate === 0 ? (
                                        <View style={styles.nothingToImport}>
                                            <Ionicons name="warning-outline" size={32} color="#F57F17" />
                                            <Text style={styles.nothingText}>Nothing to import. All rows are either invalid or already exist.</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.confirmImportBtn} onPress={handleConfirmImport}>
                                            <LinearGradient colors={['#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmImportGradient}>
                                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                                <Text style={styles.confirmImportText}>
                                                    Confirm Import ({importPreview.toCreate} create{importPreview.toUpdate > 0 ? `, ${importPreview.toUpdate} update` : ''})
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Import Progress Modal ───────────────────────────────── */}
            <Modal animationType="fade" transparent visible={importProgressVisible}>
                <View style={styles.progressOverlay}>
                    <View style={styles.progressBox}>
                        <ActivityIndicator size="large" color="#D32F2F" />
                        <Text style={styles.progressTitle}>Importing Students...</Text>
                        <Text style={styles.progressSubtitle}>Please wait. Do not close this screen.</Text>
                    </View>
                </View>
            </Modal>

            {/* ── Import Report Modal ─────────────────────────────────── */}
            <Modal animationType="slide" transparent visible={importReportVisible} onRequestClose={() => setImportReportVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Import Report</Text>
                            <TouchableOpacity onPress={() => setImportReportVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {importReport && (
                                <>
                                    <View style={styles.reportSuccessBanner}>
                                        <Ionicons name="checkmark-circle" size={48} color="#2E7D32" />
                                        <Text style={styles.reportSuccessTitle}>Import Complete!</Text>
                                    </View>

                                    <View style={styles.previewStatsRow}>
                                        <View style={[styles.previewStat, { backgroundColor: '#E8F5E9' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#2E7D32' }]}>{importReport.importedCount || 0}</Text>
                                            <Text style={styles.previewStatLabel}>Created</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#E3F2FD' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#1565C0' }]}>{importReport.updatedCount || 0}</Text>
                                            <Text style={styles.previewStatLabel}>Updated</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#FFF3E0' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#E65100' }]}>{importReport.skippedCount || 0}</Text>
                                            <Text style={styles.previewStatLabel}>Skipped</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#FFEBEE' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#C62828' }]}>{importReport.failedCount || 0}</Text>
                                            <Text style={styles.previewStatLabel}>Failed</Text>
                                        </View>
                                    </View>

                                    {importedCredentials.length > 0 && (
                                        <TouchableOpacity style={styles.credentialsBtn} onPress={handleDownloadCredentials}>
                                            <Ionicons name="key-outline" size={20} color="#fff" />
                                            <Text style={styles.credentialsBtnText}>Download Credentials Report ({importedCredentials.length} accounts)</Text>
                                        </TouchableOpacity>
                                    )}

                                    {importReport.invalidRows?.length > 0 && (
                                        <>
                                            <Text style={styles.errorSectionTitle}>Failed Rows</Text>
                                            {importReport.invalidRows.map((r, i) => (
                                                <View key={i} style={styles.errorRow}>
                                                    <Text style={styles.errorRowNum}>Row {r.rowNum}:</Text>
                                                    <Text style={styles.errorRowText}>{r.errors.join(' • ')}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Export Modal ────────────────────────────────────────── */}
            <Modal animationType="slide" transparent visible={exportModalVisible} onRequestClose={() => setExportModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Export Students</Text>
                            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formLabel}>Format</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                            {['xlsx', 'csv'].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.formatChip, exportFormat === f && styles.activeFormatChip]}
                                    onPress={() => setExportFormat(f)}
                                >
                                    <Text style={[styles.formatChipText, exportFormat === f && styles.activeFormatChipText]}>{f.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.formLabel}>Filter by Department Code (optional)</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="e.g. CSE, ECE, MECH"
                            value={exportDept}
                            onChangeText={setExportDept}
                            autoCapitalize="characters"
                        />

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Year (optional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="1–4"
                                    value={exportYear}
                                    onChangeText={setExportYear}
                                    keyboardType="number-pad"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Semester (optional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="1–8"
                                    value={exportSemester}
                                    onChangeText={setExportSemester}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitRegisterBtn, exportLoading && { opacity: 0.7 }]}
                            onPress={handleExportStudents}
                            disabled={exportLoading}
                        >
                            <LinearGradient
                                colors={['#1565C0', '#1976D2']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.registerBtnGradient}
                            >
                                {exportLoading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <>
                                        <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.registerBtnText}>Export Students</Text>
                                    </>
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

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
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    addBtn: {
        padding: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
        marginTop: 10,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: '100%', fontSize: 15, color: '#333' },

    listContent: { padding: 20 },
    studentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F' },
    headerInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    studentReg: { fontSize: 12, color: '#666', marginTop: 2 },
    deptBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    deptText: { fontSize: 10, fontWeight: 'bold', color: '#666' },

    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },

    contactRow: { flexDirection: 'row', justifyContent: 'space-around' },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        height: '85%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        paddingBottom: 15,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    closeBtn: { padding: 5 },

    profileHeader: { alignItems: 'center', marginBottom: 25 },
    largeAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#D32F2F',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    largeAvatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    profileReg: { fontSize: 14, color: '#666' },

    infoSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#D32F2F', paddingLeft: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    infoLabel: { color: '#666', fontSize: 14 },
    infoValue: { color: '#333', fontSize: 14, fontWeight: '500' },

    parentCard: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    parentLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase' },
    parentName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    parentPhone: { fontSize: 13, color: '#666' },
    callRoundBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#00A86B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteStudentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    deleteStudentText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 15,
    },

    // Form inputs styles
    formLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555',
        marginBottom: 8,
        marginTop: 12,
        textTransform: 'uppercase',
    },
    sectionSubtitleHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 25,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 5,
    },
    formInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
        fontSize: 15,
        color: '#333',
        marginBottom: 5,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
    },
    genderChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    activeGenderChip: {
        backgroundColor: '#D32F2F',
        borderColor: '#D32F2F',
    },
    genderChipText: {
        fontSize: 13,
        color: '#555',
    },
    activeGenderChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    formSelectorContainer: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    deptChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activeDeptChip: {
        backgroundColor: '#D32F2F',
        borderColor: '#D32F2F',
    },
    deptChipText: {
        fontSize: 13,
        color: '#555',
    },
    activeDeptChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    numChip: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeNumChip: {
        backgroundColor: '#D32F2F',
        borderColor: '#D32F2F',
    },
    numChipText: {
        fontSize: 12,
        color: '#555',
    },
    activeNumChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitRegisterBtn: {
        marginTop: 30,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
    },
    registerBtnGradient: {
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    // ── Bulk Import/Export styles ────────────────────────────────────────────
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerIconBtn: {
        alignItems: 'center',
        padding: 6,
        marginHorizontal: 2,
    },
    headerIconLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 9,
        marginTop: 2,
        fontWeight: '600',
    },
    uploadZone: {
        borderWidth: 2,
        borderColor: '#FFCDD2',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        marginVertical: 10,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    uploadSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    selectFileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D32F2F',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    selectFileBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    templateHintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    templateHintText: {
        color: '#D32F2F',
        fontSize: 13,
        fontWeight: '600',
    },
    modeChip: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    activeModeChip: {
        backgroundColor: '#D32F2F',
        borderColor: '#D32F2F',
    },
    modeChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
    activeModeChipText: { color: '#fff' },

    previewStatsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    previewStat: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    previewStatNum: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    previewStatLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
        textAlign: 'center',
    },
    errorSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#C62828',
        marginBottom: 8,
        marginTop: 4,
    },
    errorRow: {
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#EF5350',
    },
    errorRowNum: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#B71C1C',
        marginBottom: 2,
    },
    errorRowText: {
        fontSize: 12,
        color: '#555',
    },
    confirmImportBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
    },
    confirmImportGradient: {
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    confirmImportText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    nothingToImport: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFDE7',
        borderRadius: 12,
        marginTop: 10,
    },
    nothingText: {
        color: '#F57F17',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
    },
    progressOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        width: 280,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    progressSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
        textAlign: 'center',
    },
    reportSuccessBanner: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    reportSuccessTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 10,
    },
    credentialsBtn: {
        backgroundColor: '#1565C0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        marginVertical: 16,
    },
    credentialsBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    formatChip: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    activeFormatChip: {
        backgroundColor: '#1565C0',
        borderColor: '#1565C0',
    },
    formatChipText: { fontSize: 14, color: '#555', fontWeight: '700' },
    activeFormatChipText: { color: '#fff' },

    // ─── Advanced filter panel ────────────────────────────────────────────────
    filterToggleBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        position: 'relative',
    },
    filterToggleBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    filterDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#EF5350',
    },
    advancedFiltersPanel: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterRowLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        minWidth: 40,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipSm: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    filterChipText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#C62828',
    },

    // ─── Record count bar ─────────────────────────────────────────────────────
    recordCountBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    recordCountText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },

    // ─── Pagination controls ──────────────────────────────────────────────────
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        marginTop: 8,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C62828',
    },
    pageBtnDisabled: {
        borderColor: '#E0E0E0',
    },
    pageBtnText: {
        fontSize: 13,
        color: '#C62828',
        fontWeight: '600',
    },
    pageIndicator: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },

    // ─── State containers ─────────────────────────────────────────────────────
    stateContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 10,
    },
    stateTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
    },
    stateText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C62828',
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 18,
        gap: 6,
        marginTop: 6,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    clearFiltersBtn: {
        marginTop: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C62828',
    },
    clearFiltersBtnText: {
        fontSize: 13,
        color: '#C62828',
        fontWeight: '600',
    },
});
