import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../services/api';

export default function ActivityHistory() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [metadata, setMetadata] = useState({ modules: [], actions: [], admins: [] });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    // Filters
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Detail Modal
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // Load filter metadata
    const loadFiltersMetadata = async () => {
        try {
            const res = await api.get('/admins/activity/filters');
            setMetadata(res.data || { modules: [], actions: [], admins: [] });
        } catch (error) {
            console.error('Error fetching activity filters:', error);
        }
    };

    // Load paginated logs
    const loadLogs = async (currentPage = 1) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', currentPage);
            queryParams.append('limit', limit);
            if (search.trim()) queryParams.append('search', search.trim());
            if (date.trim()) queryParams.append('date', date.trim());
            if (selectedAdmin) queryParams.append('administrator', selectedAdmin);
            if (selectedModule) queryParams.append('module', selectedModule);
            if (selectedAction) queryParams.append('action', selectedAction);

            const res = await api.get(`/admins/activity?${queryParams.toString()}`);
            setLogs(res.data?.data || []);
            setTotalPages(res.data?.pagination?.pages || 1);
            setTotalRecords(res.data?.pagination?.total || 0);
            setPage(currentPage);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            Alert.alert('Error', 'Failed to load activity logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiltersMetadata();
        loadLogs(1);
    }, [selectedAdmin, selectedModule, selectedAction]);

    // Handle search button/submit
    const handleSearchSubmit = () => {
        loadLogs(1);
    };

    // Reset filters
    const clearFilters = () => {
        setSearch('');
        setDate('');
        setSelectedAdmin('');
        setSelectedModule('');
        setSelectedAction('');
        loadLogs(1);
    };

    const viewDetails = (log) => {
        setSelectedLog(log);
        setDetailModalVisible(true);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getModuleIcon = (mod) => {
        switch (mod) {
            case 'Students': return 'graduation-cap';
            case 'Faculty': return 'user';
            case 'Departments': return 'building';
            case 'Discipline': return 'gavel';
            case 'Announcements': return 'bullhorn';
            case 'Illegal Activities': return 'exclamation-triangle';
            default: return 'history';
        }
    };

    const getModuleColor = (mod) => {
        switch (mod) {
            case 'Students': return { color: '#0056D2', bg: '#E3F2FD' };
            case 'Faculty': return { color: '#00A86B', bg: '#E8F5E9' };
            case 'Departments': return { color: '#FF8C00', bg: '#FFF3E0' };
            case 'Discipline': return { color: '#C62828', bg: '#FFEBEE' };
            case 'Announcements': return { color: '#6A0DAD', bg: '#F3E5F5' };
            case 'Illegal Activities': return { color: '#37474F', bg: '#ECEFF1' };
            default: return { color: '#FF5722', bg: '#FBE9E7' };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <LinearGradient colors={['#D32F2F', '#B71C1C']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Activity History</Text>
                        <Text style={styles.headerSubtitle}>Administrative Operations Activity Log</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Filter Toggle & Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBarContainer}>
                    <FontAwesome name="search" size={16} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search logs description or action..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearchSubmit}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, showFilters && styles.actionBtnActive]} 
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <FontAwesome name="filter" size={14} color={showFilters ? '#fff' : '#666'} />
                        <Text style={[styles.actionBtnText, showFilters && styles.actionBtnTextActive]}>Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSearchSubmit}>
                        <FontAwesome name="refresh" size={14} color="#666" />
                        <Text style={styles.actionBtnText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <Animated.View entering={FadeInDown} style={styles.filterPanel}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.filterTitle}>Filter Options</Text>
                        
                        <View style={styles.filterField}>
                            <Text style={styles.filterLabel}>Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="e.g. 2026-06-26"
                                placeholderTextColor="#bbb"
                                value={date}
                                onChangeText={setDate}
                                onSubmitEditing={handleSearchSubmit}
                            />
                        </View>

                        <View style={styles.filterField}>
                            <Text style={styles.filterLabel}>Administrator</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedAdmin}
                                    onValueChange={(val) => setSelectedAdmin(val)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="All Administrators" value="" />
                                    {metadata.admins.map((admin) => (
                                        <Picker.Item key={admin._id} label={admin.name} value={admin._id} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.filterField}>
                            <Text style={styles.filterLabel}>Module</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedModule}
                                    onValueChange={(val) => setSelectedModule(val)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="All Modules" value="" />
                                    {metadata.modules.map((mod) => (
                                        <Picker.Item key={mod} label={mod} value={mod} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.filterField}>
                            <Text style={styles.filterLabel}>Action Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedAction}
                                    onValueChange={(val) => setSelectedAction(val)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="All Action Types" value="" />
                                    {metadata.actions.map((act) => (
                                        <Picker.Item key={act} label={act} value={act} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.filterActions}>
                            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={() => { loadLogs(1); setShowFilters(false); }}>
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            )}

            {/* Logs List */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#B71C1C" />
                    <Text style={styles.loaderText}>Loading system activity logs...</Text>
                </View>
            ) : logs.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome name="history" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No activity records match your criteria.</Text>
                </View>
            ) : (
                <FlatListWrapper logs={logs} viewDetails={viewDetails} formatDate={formatDate} formatTime={formatTime} getModuleIcon={getModuleIcon} getModuleColor={getModuleColor} />
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <View style={styles.paginationRow}>
                    <TouchableOpacity
                        style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                        disabled={page === 1}
                        onPress={() => loadLogs(page - 1)}
                    >
                        <Ionicons name="chevron-back" size={16} color={page === 1 ? '#bbb' : '#333'} />
                        <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageIndicator}>
                        Page {page} of {totalPages} ({totalRecords} total)
                    </Text>
                    <TouchableOpacity
                        style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                        disabled={page === totalPages}
                        onPress={() => loadLogs(page + 1)}
                    >
                        <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color={page === totalPages ? '#bbb' : '#333'} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Log Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={SlideInUp} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Activity Detail</Text>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        {selectedLog && (
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Operation:</Text>
                                    <Text style={styles.detailValueBold}>{selectedLog.action}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Module:</Text>
                                    <View style={[styles.moduleBadge, { backgroundColor: getModuleColor(selectedLog.module).bg }]}>
                                        <Text style={[styles.moduleBadgeText, { color: getModuleColor(selectedLog.module).color }]}>
                                            {selectedLog.module}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Date & Time:</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(selectedLog.createdAt)} at {formatTime(selectedLog.createdAt)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Administrator:</Text>
                                    <View>
                                        <Text style={styles.detailValueBold}>{selectedLog.adminUser?.name || 'System Admin'}</Text>
                                        <Text style={styles.detailSubValue}>{selectedLog.adminUser?.email || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Description:</Text>
                                    <Text style={styles.detailValue}>{selectedLog.description}</Text>
                                </View>
                                
                                {selectedLog.entityId && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Affected Entity:</Text>
                                        <Text style={styles.detailValueCode}>
                                            {selectedLog.entityType || 'ID'}: {selectedLog.entityId}
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.metadataTitle}>Transaction Metadata</Text>
                                <ScrollView horizontal style={styles.codeBlockContainer}>
                                    <Text style={styles.codeText}>
                                        {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                                    </Text>
                                </ScrollView>
                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

// FlatList helper to render items cleanly in React Native
function FlatListWrapper({ logs, viewDetails, formatDate, formatTime, getModuleIcon, getModuleColor }) {
    return (
        <ScrollView style={styles.logsList} showsVerticalScrollIndicator={false}>
            {logs.map((item, index) => {
                const colors = getModuleColor(item.module);
                const icon = getModuleIcon(item.module);
                return (
                    <Animated.View key={item._id} entering={FadeInDown.delay(index * 50)} style={styles.logCard}>
                        <TouchableOpacity style={styles.logCardPressable} onPress={() => viewDetails(item)} activeOpacity={0.7}>
                            <View style={[styles.moduleIconBox, { backgroundColor: colors.bg }]}>
                                <FontAwesome name={icon} size={16} color={colors.color} />
                            </View>
                            <View style={styles.logTextContent}>
                                <View style={styles.logTopLine}>
                                    <Text style={styles.logActionText}>{item.action}</Text>
                                    <Text style={styles.logTimeText}>{formatTime(item.createdAt)}</Text>
                                </View>
                                <Text style={styles.logDescText} numberOfLines={2}>{item.description}</Text>
                                <View style={styles.logBottomLine}>
                                    <Text style={styles.logOperatorText}>By: {item.adminUser?.name || 'Admin'}</Text>
                                    <Text style={styles.logDateText}>{formatDate(item.createdAt)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 25,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 8,
        shadowColor: '#B71C1C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        height: '100%',
        outlineStyle: 'none', // for web
    },
    clearSearchBtn: {
        padding: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        width: '48%',
    },
    actionBtnActive: {
        backgroundColor: '#B71C1C',
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#444',
        marginLeft: 6,
    },
    actionBtnTextActive: {
        color: '#fff',
    },
    filterPanel: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        maxHeight: 300,
    },
    filterTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        marginTop: 5,
    },
    filterField: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
        marginBottom: 6,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        height: 38,
        paddingHorizontal: 10,
        fontSize: 13,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
        justifyContent: 'center',
        height: 38,
    },
    picker: {
        width: '100%',
        height: '100%',
        color: '#333',
        fontSize: 13,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    clearBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#ECEFF1',
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
    },
    clearBtnText: {
        color: '#455A64',
        fontSize: 13,
        fontWeight: '600',
    },
    applyBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#B71C1C',
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loaderText: {
        marginTop: 12,
        color: '#666',
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 15,
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
    logsList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    logCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1.5,
    },
    logCardPressable: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'flex-start',
    },
    moduleIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    logTextContent: {
        flex: 1,
    },
    logTopLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    logActionText: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 13.5,
    },
    logTimeText: {
        fontSize: 11,
        color: '#999',
    },
    logDescText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
        marginBottom: 6,
    },
    logBottomLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logOperatorText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#555',
    },
    logDateText: {
        fontSize: 11,
        color: '#999',
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    pageBtnDisabled: {
        backgroundColor: '#E5E7EB',
        opacity: 0.5,
    },
    pageBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 4,
    },
    pageBtnTextDisabled: {
        color: '#999',
    },
    pageIndicator: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '75%',
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    detailRow: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    detailValueBold: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    detailSubValue: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    detailValueCode: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#B71C1C',
        backgroundColor: '#FFF3F3',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    moduleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    moduleBadgeText: {
        fontSize: 11.5,
        fontWeight: 'bold',
    },
    metadataTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 8,
    },
    codeBlockContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12.5,
        color: '#38BDF8',
        lineHeight: 18,
    },
});
