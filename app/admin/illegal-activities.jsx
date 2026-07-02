import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { FlatList, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Linking } from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function AdminIllegalActivities() {
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await api.get('/illegal-activities?limit=100');
            setRecords(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching illegal activities:', error);
            Alert.alert('Error', 'Failed to load major regulatory violations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return '#B71C1C';
            case 'High': return '#D32F2F';
            case 'Severe': return '#C62828';
            default: return '#EF5350';
        }
    };

    const handleDownloadReport = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => {
                console.error('Failed to open report URL:', err);
                Alert.alert('Error', 'Unable to open official report link.');
            });
        } else {
            Alert.alert('Not Available', 'No official PDF report url attached to this record.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#B71C1C" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#263238', '#37474F']} // Dark Slate for Investigation
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <MaterialIcons name="security" size={28} color="#EF5350" style={{ marginRight: 10 }} />
                    <View>
                        <Text style={styles.headerTitle}>Major Violations</Text>
                        <Text style={styles.headerSubtitle}>Legal & Security Incidents</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.alertBox}>
                <FontAwesome name="exclamation-triangle" size={16} color="#D32F2F" />
                <Text style={styles.alertText}> Confidential Records. Authorized Access Only.</Text>
            </View>

            <FlatList
                data={records}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    const studentName = item.student?.user?.name || 'N/A';
                    const studentReg = item.student?.registerNumber || 'N/A';
                    const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });

                    return (
                        <Animated.View entering={FadeInDown.delay(index * 150)}>
                            <TouchableOpacity style={styles.card} onPress={() => setSelectedRecord(item)} activeOpacity={0.9}>
                                <View style={[styles.borderStrip, { backgroundColor: getSeverityColor(item.severity) }]} />
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTop}>
                                        <Text style={styles.date}>{formattedDate}</Text>
                                        <View style={[styles.statusBadge, item.status === 'Resolved' ? styles.statusResolved : styles.statusPending]}>
                                            <Text style={[styles.statusText, item.status === 'Resolved' ? { color: '#2E7D32' } : { color: '#C62828' }]}>
                                                {item.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.issue}>{item.issue}</Text>

                                    <View style={styles.studentRow}>
                                        <FontAwesome name="user-secret" size={14} color="#555" />
                                        <Text style={styles.studentName}> {studentName} ({studentReg})</Text>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Reported By:</Text>
                                        <Text style={styles.metaValue}>{item.reportedBy}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
            />

            {/* Details Modal */}
            <Modal
                visible={!!selectedRecord}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedRecord(null)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={SlideInUp.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Incident Details</Text>
                            <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Student</Text>
                                <Text style={styles.detailValue}>{selectedRecord?.student?.user?.name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Register No</Text>
                                <Text style={styles.detailValue}>{selectedRecord?.student?.registerNumber}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Incident</Text>
                                <Text style={[styles.detailValue, { color: '#D32F2F', fontWeight: 'bold' }]}>{selectedRecord?.issue}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Severity</Text>
                                <Text style={styles.detailValue}>{selectedRecord?.severity}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={styles.detailValue}>{selectedRecord?.status}</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.actionBtn, !selectedRecord?.officialReportUrl && { backgroundColor: '#78909c' }]} 
                                onPress={() => handleDownloadReport(selectedRecord?.officialReportUrl)}
                            >
                                <Text style={styles.actionBtnText}>
                                    {selectedRecord?.officialReportUrl ? 'Download Official Report' : 'No Official Report'}
                                </Text>
                                <MaterialIcons name="file-download" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEFF1' },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    alertBox: {
        flexDirection: 'row',
        backgroundColor: '#FFEBEE',
        margin: 20,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#D32F2F',
        alignItems: 'center',
    },
    alertText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },

    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
    },
    borderStrip: { width: 5 },
    cardBody: { flex: 1, padding: 15 },

    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    date: { fontSize: 12, color: '#999' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusResolved: { backgroundColor: '#E8F5E9' },
    statusPending: { backgroundColor: '#FFEBEE' },
    statusText: { fontSize: 10, fontWeight: 'bold' },

    issue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },

    studentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    studentName: { fontSize: 13, color: '#555' },

    divider: { height: 1, backgroundColor: '#EEE', marginBottom: 8 },

    metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
    metaLabel: { fontSize: 11, color: '#999' },
    metaValue: { fontSize: 11, color: '#333', fontWeight: '600' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
    },
    modalHeader: {
        backgroundColor: '#263238',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    detailLabel: { color: '#666', fontSize: 14 },
    detailValue: { color: '#333', fontSize: 14, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 20 },

    actionBtn: {
        backgroundColor: '#37474F',
        marginTop: 25,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: { color: '#fff', fontWeight: 'bold', marginRight: 10 },
});
