import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, FlatList, Linking, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api, API_URL, getAuthToken } from '../../services/api';
import useSearch from '../../hooks/useSearch';

export default function ManageFaculty() {
    // ── Server-side search & filter (replaces all client-side filtering) ──────
    const {
        query: search,
        data: faculty,
        pagination,
        loading: searchLoading,
        error: searchError,
        isEmpty,
        updateQuery: setSearch,
        updateFilter,
        setAllFilters,
        filters: activeFilters,
        nextPage,
        prevPage,
        retry,
        reset: resetSearch,
    } = useSearch('/search/faculty', { department: '', designation: '' }, { defaultLimit: 20 });

    const [loading, setLoading] = useState(false); // for initial dept fetch only
    const [departments, setDepartments] = useState([]);
    const [filterMeta, setFilterMeta] = useState({ designations: [] });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Modals
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    // Form states for register
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('Faculty@123');
    const [formEmpId, setFormEmpId] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formDept, setFormDept] = useState('');
    const [formDesignation, setFormDesignation] = useState('Assistant Professor');
    const [formSpecialization, setFormSpecialization] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
    const [exportDesignation, setExportDesignation] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    const loadDepartmentsAndMeta = async () => {
        try {
            const [deptsRes, metaRes] = await Promise.all([
                api.get('/departments'),
                api.get('/search/meta/faculty'),
            ]);
            const deptsList = deptsRes.data?.data || [];
            setDepartments(deptsList);
            if (deptsList.length > 0) setFormDept(deptsList[0]._id);
            setFilterMeta(metaRes.data || { designations: [] });
        } catch (err) {
            console.error('Failed to load departments/meta:', err);
        }
    };

    // After create/import, refresh list
    const loadData = useCallback(() => {
        loadDepartmentsAndMeta();
        resetSearch();
    }, [resetSearch]);

    useEffect(() => {
        loadDepartmentsAndMeta();
    }, []);

    const handleCall = (name, phone) => {
        Alert.alert("Call Faculty", `Calling ${name}...`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
        ]);
    };

    const handleEmail = (email) => {
        Linking.openURL(`mailto:${email}`);
    };

    const handleDeleteFaculty = (fac) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete Prof. ${fac.user?.name || 'this faculty member'}? This will delete their academic details and access account permanently.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/faculty/${fac._id}`);
                            Alert.alert('Success', 'Faculty profile deleted successfully.');
                            setDetailsModalVisible(false);
                            loadData();
                        } catch (err) {
                            console.error('Delete failed:', err);
                            Alert.alert('Error', 'Failed to delete faculty member.');
                        }
                    }
                }
            ]
        );
    };

    const handleRegister = async () => {
        if (!formName.trim() || !formEmail.trim() || !formEmpId.trim() || !formPhone.trim() || !formDept || !formDesignation.trim()) {
            Alert.alert('Validation Error', 'Please fill in Name, Email, Employee ID, Phone, Department, and Designation.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formName.trim(),
                email: formEmail.trim().toLowerCase(),
                password: formPassword,
                role: 'faculty',
                employeeId: formEmpId.trim().toUpperCase(),
                phone: formPhone.trim(),
                department: formDept,
                designation: formDesignation.trim(),
                specialization: formSpecialization.trim()
            };
            await api.post('/auth/register', payload);
            Alert.alert('Success', 'Faculty member registered successfully.');
            setCreateModalVisible(false);

            // Clear form
            setFormName('');
            setFormEmail('');
            setFormEmpId('');
            setFormPhone('');
            setFormSpecialization('');

            loadData();
        } catch (err) {
            console.error('Registration failed:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to register faculty member.');
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
            const res = await api.upload('/bulk/faculty/import', formData, `?preview=true&mode=${importMode}`);
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
            const file = fileInputRef.current?.files?.[0];
            if (!file) throw new Error('File reference lost. Please re-upload.');
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.upload('/bulk/faculty/import', formData, `?mode=${importMode}`);
            setImportReport(res.data);
            setImportedCredentials(res.data?.importedRecords || []);
            setCredentialsDownloadId(res.data?.credentialsDownloadId || '');
            setImportProgressVisible(false);
            setImportReportVisible(true);
            loadData();
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
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/bulk/faculty/credentials`, {
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
        a.download = 'faculty_credentials.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/bulk/faculty/template`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Template download failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'faculty_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to download template.');
        }
    };

    const handleExportFaculty = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({ format: exportFormat });
            if (exportDept) params.append('dept', exportDept);
            if (exportDesignation) params.append('designation', exportDesignation);
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/bulk/faculty/export?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const cd = response.headers.get('Content-Disposition') || '';
            const fname = cd.split('filename=')[1]?.replace(/"/g, '') || `faculty_export.${exportFormat}`;
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
            Alert.alert('Export Failed', err.message || 'Failed to export faculty.');
        } finally {
            setExportLoading(false);
        }
    };


    const getSubjectStr = (fac) => {
        if (fac.subjects && fac.subjects.length > 0) {
            return fac.subjects.map(s => s.code).join(', ');
        }
        return 'No subjects assigned';
    };

    if (searchLoading && faculty.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#C62828" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading faculty directory...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#C62828', '#B71C1C']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Faculty Management</Text>
                <Text style={styles.headerSubtitle}>Directory of Professors & Staff</Text>

                {/* Bulk Action Toolbar */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    <TouchableOpacity style={styles.bulkToolbarBtn} onPress={handleDownloadTemplate}>
                        <Ionicons name="document-outline" size={16} color="#fff" />
                        <Text style={styles.bulkToolbarText}>Template</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bulkToolbarBtn} onPress={() => setImportModalVisible(true)}>
                        <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                        <Text style={styles.bulkToolbarText}>Import</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bulkToolbarBtn} onPress={() => setExportModalVisible(true)}>
                        <Ionicons name="cloud-download-outline" size={16} color="#fff" />
                        <Text style={styles.bulkToolbarText}>Export</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Name, employee ID, email..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={search}
                        onChangeText={setSearch}
                        id="faculty-search-input"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.filterToggleBtn, showAdvancedFilters && styles.filterToggleBtnActive]}
                        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                        <Ionicons name="options-outline" size={18} color={showAdvancedFilters ? '#C62828' : 'rgba(255,255,255,0.8)'} />
                        {(activeFilters.department || activeFilters.designation) && (
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

                        {/* Designation filter */}
                        <View style={styles.filterRow}>
                            <Text style={styles.filterRowLabel}>Role:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                {(filterMeta.designations.length > 0 ? filterMeta.designations : ['Professor', 'Associate Professor', 'Assistant Professor']).map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.filterChipSm, activeFilters.designation === d && styles.filterChipActive]}
                                        onPress={() => updateFilter('designation', activeFilters.designation === d ? '' : d)}
                                    >
                                        <Text style={[styles.filterChipText, activeFilters.designation === d && styles.filterChipTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                                {(activeFilters.department || activeFilters.designation) && (
                                    <TouchableOpacity
                                        style={[styles.filterChipSm, { borderColor: '#EF5350' }]}
                                        onPress={() => setAllFilters({ department: '', designation: '' })}
                                    >
                                        <Text style={[styles.filterChipText, { color: '#EF5350' }]}>Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                )}
            </LinearGradient>

            {/* Record count bar */}
            {!searchLoading && (
                <View style={styles.recordCountBar}>
                    <Text style={styles.recordCountText}>
                        {pagination.total} faculty member{pagination.total !== 1 ? 's' : ''}
                        {pagination.pages > 1 ? ` · Page ${pagination.page} of ${pagination.pages}` : ''}
                    </Text>
                </View>
            )}

            <FlatList
                data={faculty}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    searchLoading ? (
                        <View style={styles.stateContainer}>
                            <ActivityIndicator size="large" color="#C62828" />
                            <Text style={styles.stateText}>Searching faculty...</Text>
                        </View>
                    ) : searchError ? (
                        <View style={styles.stateContainer}>
                            <Ionicons name="wifi-outline" size={40} color="#EF5350" />
                            <Text style={styles.stateTitle}>Search Failed</Text>
                            <Text style={styles.stateText}>{searchError}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={retry}>
                                <Ionicons name="refresh" size={16} color="#fff" />
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.stateContainer}>
                            <Ionicons name="people-outline" size={48} color="#BDBDBD" />
                            <Text style={styles.stateTitle}>No Faculty Found</Text>
                            <Text style={styles.stateText}>
                                {search || Object.values(activeFilters).some(Boolean)
                                    ? 'No faculty match your search or filters.'
                                    : 'No faculty members registered yet.'}
                            </Text>
                            {(search || Object.values(activeFilters).some(Boolean)) && (
                                <TouchableOpacity style={styles.clearFiltersBtn} onPress={() => { setSearch(''); setAllFilters({ department: '', designation: '' }); }}>
                                    <Text style={styles.clearFiltersBtnText}>Clear Search & Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }
                ListFooterComponent={
                    pagination.pages > 1 && !searchLoading ? (
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
                    ) : null
                }
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 100)}>
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.9}
                            onPress={() => {
                                setSelectedFaculty(item);
                                setDetailsModalVisible(true);
                            }}
                        >
                            <View style={styles.row}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{(item.user?.name || 'F').replace(/^(Dr\.|Prof\.)\s+/i, '').charAt(0)}</Text>
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.name}>{item.user?.name || 'Faculty'}</Text>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.deptBadge}>
                                            <Text style={styles.deptText}>{item.department?.code || 'CSE'}</Text>
                                        </View>
                                        <Text style={styles.designationText}>{item.designation}</Text>
                                    </View>
                                    <Text style={styles.subject}>
                                        <FontAwesome name="book" size={12} color="#666" /> {getSubjectStr(item)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.user?.name, item.phone)}>
                                    <Ionicons name="call" size={18} color="#2E7D32" />
                                    <Text style={[styles.actionText, { color: '#2E7D32' }]}>Call</Text>
                                </TouchableOpacity>
                                <View style={styles.vDivider} />
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(item.user?.email)}>
                                    <Ionicons name="mail" size={18} color="#1565C0" />
                                    <Text style={[styles.actionText, { color: '#1565C0' }]}>Email</Text>
                                </TouchableOpacity>
                                <View style={styles.vDivider} />
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteFaculty(item)}>
                                    <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                                    <Text style={[styles.actionText, { color: '#D32F2F' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            />

            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setCreateModalVisible(true)}
            >
                <LinearGradient
                    colors={['#C62828', '#D32F2F']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="person-add" size={24} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            {/* View Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Faculty Profile</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedFaculty && (
                                <>
                                    <View style={styles.profileHeader}>
                                        <View style={styles.largeAvatar}>
                                            <Text style={styles.largeAvatarText}>
                                                {(selectedFaculty.user?.name || 'F').replace(/^(Dr\.|Prof\.)\s+/i, '').charAt(0)}
                                            </Text>
                                        </View>
                                        <Text style={styles.profileName}>{selectedFaculty.user?.name || 'Faculty'}</Text>
                                        <Text style={styles.profileReg}>{selectedFaculty.designation}</Text>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Professional Details</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Employee ID</Text>
                                            <Text style={styles.infoValue}>{selectedFaculty.employeeId || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Department</Text>
                                            <Text style={styles.infoValue}>{selectedFaculty.department?.name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Specialization</Text>
                                            <Text style={styles.infoValue}>{selectedFaculty.specialization || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Joining Date</Text>
                                            <Text style={styles.infoValue}>
                                                {selectedFaculty.joiningDate ? new Date(selectedFaculty.joiningDate).toLocaleDateString() : 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Contact Information</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email</Text>
                                            <Text style={styles.infoValue}>{selectedFaculty.user?.email || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Phone</Text>
                                            <Text style={styles.infoValue}>{selectedFaculty.phone || 'N/A'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Assigned Subjects</Text>
                                        {selectedFaculty.subjects && selectedFaculty.subjects.length > 0 ? (
                                            selectedFaculty.subjects.map(s => (
                                                <View key={s._id} style={styles.subjectItem}>
                                                    <Ionicons name="book" size={16} color="#00695C" />
                                                    <Text style={styles.subjectText}>{s.code} - {s.name} (Sem {s.semester})</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ color: '#888', fontStyle: 'italic', paddingLeft: 10 }}>No subjects assigned</Text>
                                        )}
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Create Faculty Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Register Faculty</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                            <Text style={styles.formLabel}>Full Name</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Dr. A. Sharma"
                                value={formName}
                                onChangeText={setFormName}
                            />

                            <Text style={styles.formLabel}>Email Address</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="sharma@kce.edu"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formEmail}
                                onChangeText={setFormEmail}
                            />

                            <Text style={styles.formLabel}>Employee ID</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="KCE-FAC001"
                                autoCapitalize="characters"
                                value={formEmpId}
                                onChangeText={setFormEmpId}
                            />

                            <Text style={styles.formLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. +91 9876543101"
                                value={formPhone}
                                onChangeText={setFormPhone}
                            />

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

                            <Text style={styles.formLabel}>Designation</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. Professor & HOD"
                                value={formDesignation}
                                onChangeText={setFormDesignation}
                            />

                            <Text style={styles.formLabel}>Specialization</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. Cloud Computing"
                                value={formSpecialization}
                                onChangeText={setFormSpecialization}
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
                                        {submitting ? 'Registering Faculty...' : 'Register Faculty'}
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
                            <Text style={styles.modalTitle}>Import Faculty</Text>
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
                                <TouchableOpacity style={styles.selectFileBtn} onPress={() => fileInputRef.current?.click()}>
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
                                            <Text style={styles.previewStatLabel}>Total</Text>
                                        </View>
                                        <View style={[styles.previewStat, { backgroundColor: '#E3F2FD' }]}>
                                            <Text style={[styles.previewStatNum, { color: '#1565C0' }]}>{importPreview.toCreate}</Text>
                                            <Text style={styles.previewStatLabel}>Create</Text>
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
                                            <Text style={styles.errorSectionTitle}>⚠️ Invalid Rows</Text>
                                            {importPreview.invalidRows.map((r, i) => (
                                                <View key={i} style={styles.errorRow}>
                                                    <Text style={styles.errorRowNum}>Row {r.rowNum}:</Text>
                                                    <Text style={styles.errorRowText}>{r.errors.join(' • ')}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}
                                    {importPreview.toCreate === 0 && importPreview.toUpdate === 0 ? (
                                        <View style={styles.nothingToImport}>
                                            <Ionicons name="warning-outline" size={32} color="#F57F17" />
                                            <Text style={styles.nothingText}>Nothing to import.</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.confirmImportBtn} onPress={handleConfirmImport}>
                                            <LinearGradient colors={['#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmImportGradient}>
                                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                                <Text style={styles.confirmImportText}>Confirm Import ({importPreview.toCreate} create)</Text>
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
                        <Text style={styles.progressTitle}>Importing Faculty...</Text>
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
                                            <Text style={styles.credentialsBtnText}>Download Credentials ({importedCredentials.length} accounts)</Text>
                                        </TouchableOpacity>
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
                            <Text style={styles.modalTitle}>Export Faculty</Text>
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
                        <TextInput style={styles.formInput} placeholder="e.g. CSE, ECE" value={exportDept} onChangeText={setExportDept} autoCapitalize="characters" />
                        <Text style={styles.formLabel}>Filter by Designation (optional)</Text>
                        <TextInput style={styles.formInput} placeholder="e.g. Professor" value={exportDesignation} onChangeText={setExportDesignation} />
                        <TouchableOpacity
                            style={[styles.submitRegisterBtn, exportLoading && { opacity: 0.7 }]}
                            onPress={handleExportFaculty}
                            disabled={exportLoading}
                        >
                            <LinearGradient colors={['#1565C0', '#1976D2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerBtnGradient}>
                                {exportLoading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <>
                                        <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.registerBtnText}>Export Faculty</Text>
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
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, marginBottom: 15 },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },

    list: { padding: 20, paddingBottom: 80 },
    card: {
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
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F' },
    info: { flex: 1 },
    name: { fontSize: 17, fontWeight: 'bold', color: '#333' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    deptBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    deptText: { fontSize: 11, fontWeight: 'bold', color: '#555' },
    designationText: { fontSize: 12, color: '#666' },
    subject: { fontSize: 12, color: '#888', marginTop: 2 },

    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

    actions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
    actionText: { marginLeft: 6, fontSize: 13, fontWeight: '600' },
    vDivider: { width: 1, height: 20, backgroundColor: '#EEE' },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#C62828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabGradient: {
        flex: 1,
        borderRadius: 28,
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
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    infoLabel: { color: '#666', fontSize: 14 },
    infoValue: { color: '#333', fontSize: 14, fontWeight: '500' },
    subjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    subjectText: {
        fontSize: 14,
        color: '#333',
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
    bulkToolbarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        gap: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    bulkToolbarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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
    uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 12 },
    uploadSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
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
    selectFileBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    templateHintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    templateHintText: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },
    modeChip: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    activeModeChip: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
    modeChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
    activeModeChipText: { color: '#fff' },
    previewStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    previewStat: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
    previewStatNum: { fontSize: 22, fontWeight: 'bold' },
    previewStatLabel: { fontSize: 10, color: '#666', marginTop: 2, textAlign: 'center' },
    errorSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#C62828', marginBottom: 8, marginTop: 4 },
    errorRow: {
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#EF5350',
    },
    errorRowNum: { fontSize: 12, fontWeight: 'bold', color: '#B71C1C', marginBottom: 2 },
    errorRowText: { fontSize: 12, color: '#555' },
    confirmImportBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 16 },
    confirmImportGradient: {
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    confirmImportText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    nothingToImport: { alignItems: 'center', padding: 24, backgroundColor: '#FFFDE7', borderRadius: 12, marginTop: 10 },
    nothingText: { color: '#F57F17', fontWeight: '600', textAlign: 'center', marginTop: 8, fontSize: 14 },
    progressOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    progressBox: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', width: 280 },
    progressTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16 },
    progressSubtitle: { fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' },
    reportSuccessBanner: { alignItems: 'center', paddingVertical: 20 },
    reportSuccessTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginTop: 10 },
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
    credentialsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    formatChip: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    activeFormatChip: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
    formatChipText: { fontSize: 14, color: '#555', fontWeight: '700' },
    activeFormatChipText: { color: '#fff' },

    // ─── Advanced filter panel ────────────────────────────────────────────────
    filterToggleBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        position: 'relative',
    },
    filterToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    filterDot: {
        position: 'absolute',
        top: 4, right: 4,
        width: 7, height: 7,
        borderRadius: 4,
        backgroundColor: '#EF5350',
    },
    advancedFiltersPanel: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    },
    filterRow: {
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    },
    filterRowLabel: {
        fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', minWidth: 40,
    },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipSm: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
    filterChipText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    filterChipTextActive: { color: '#C62828' },
    recordCountBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    recordCountText: { fontSize: 12, color: '#888', fontWeight: '500' },
    paginationRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8,
    },
    pageBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 8, borderWidth: 1, borderColor: '#C62828',
    },
    pageBtnDisabled: { borderColor: '#E0E0E0' },
    pageBtnText: { fontSize: 13, color: '#C62828', fontWeight: '600' },
    pageIndicator: { fontSize: 13, color: '#555', fontWeight: '600' },
    stateContainer: {
        alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10,
    },
    stateTitle: { fontSize: 17, fontWeight: '700', color: '#333', textAlign: 'center' },
    stateText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#C62828', borderRadius: 10,
        paddingVertical: 9, paddingHorizontal: 18, gap: 6, marginTop: 6,
    },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    clearFiltersBtn: {
        marginTop: 6, paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 8, borderWidth: 1, borderColor: '#C62828',
    },
    clearFiltersBtnText: { fontSize: 13, color: '#C62828', fontWeight: '600' },
});
