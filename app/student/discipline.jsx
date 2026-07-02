import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function StudentDiscipline() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDiscipline = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/discipline/my');
            setReports(response.data || []);
        } catch (err) {
            console.error('Error loading discipline reports:', err);
            setError(err.message || 'Failed to load discipline reports.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDiscipline();
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#D32F2F" />
                <Text style={{ marginTop: 10, color: '#555', fontWeight: '500' }}>Loading Discipline History...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <FontAwesome name="exclamation-triangle" size={40} color="#D32F2F" style={{ marginBottom: 15 }} />
                <Text style={{ color: '#D32F2F', textAlign: 'center', marginBottom: 15 }}>{error}</Text>
                <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#D32F2F', borderRadius: 8 }} onPress={loadDiscipline}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const activeIncidents = reports.filter(r => r.status !== 'Resolved');
    const isGoodStanding = activeIncidents.length === 0;

    const getSeverityDetails = (record) => {
        if (record.status === 'Resolved') {
            return { color: '#4CAF50', icon: 'check-circle' };
        }
        switch (record.severity) {
            case 'Critical':
                return { color: '#D32F2F', icon: 'exclamation-circle' };
            case 'Severe':
                return { color: '#EF6C00', icon: 'exclamation-circle' };
            default:
                return { color: '#FF9800', icon: 'exclamation-circle' };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#D32F2F', '#B71C1C']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Discipline Records</Text>
                    <Text style={styles.headerSubtitle}>Conduct & Compliance History</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Overall Status Card */}
                <Animated.View entering={ZoomIn.duration(600)} style={styles.statusCard}>
                    <LinearGradient
                        colors={isGoodStanding ? ['#43A047', '#2E7D32'] : ['#E53935', '#D32F2F']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.statusGradient}
                    >
                        <View style={styles.statusIconContainer}>
                            <FontAwesome name={isGoodStanding ? "check" : "exclamation-triangle"} size={30} color={isGoodStanding ? "#43A047" : "#D32F2F"} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusTitle}>{isGoodStanding ? 'Good Standing' : 'Action Pending'}</Text>
                            <Text style={styles.statusDesc}>
                                {isGoodStanding
                                    ? 'You have no major disciplinary actions pending against you.'
                                    : `You have ${activeIncidents.length} active disciplinary report(s) under review.`}
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.sectionTitle}>History</Text>

                {reports.length === 0 ? (
                    <View style={{ backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontSize: 14 }}>No discipline records logged.</Text>
                    </View>
                ) : (
                    reports.map((record, index) => {
                        const { color } = getSeverityDetails(record);
                        const dateFormatted = record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                        const typeLabel = record.issues && record.issues[0] ? record.issues[0].toUpperCase() : 'REPORT';
                        return (
                            <Animated.View
                                key={record._id || String(index)}
                                entering={FadeInDown.delay(index * 150)}
                                style={styles.card}
                            >
                                <View style={[styles.borderStrip, { backgroundColor: color }]} />
                                <View style={styles.cardBody}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
                                            <Text style={[styles.typeText, { color: color }]}>{typeLabel}</Text>
                                        </View>
                                        <Text style={styles.dateText}>{dateFormatted}</Text>
                                    </View>

                                    <Text style={styles.reasonText}>{record.description}</Text>

                                    <View style={styles.divider} />

                                    <View style={styles.footer}>
                                        <Text style={styles.statusLabel}>Status:</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: record.status === 'Resolved' ? '#E8F5E9' : '#FFF3E0' }]}>
                                            <FontAwesome
                                                name={record.status === 'Resolved' ? 'check-circle' : 'exclamation-circle'}
                                                size={12}
                                                color={record.status === 'Resolved' ? '#2E7D32' : '#EF6C00'}
                                                style={{ marginRight: 5 }}
                                            />
                                            <Text style={[styles.statusValue, { color: record.status === 'Resolved' ? '#2E7D32' : '#EF6C00' }]}>
                                                {record.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })
                )}

                <View style={styles.infoBox}>
                    <MaterialIcons name="info-outline" size={24} color="#1565C0" />
                    <Text style={styles.infoText}>
                        Maintaining good conduct is essential for placement eligibility and hostel accommodation.
                    </Text>
                </View>

            </ScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: { marginRight: 15, marginTop: 4 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    content: { padding: 20 },

    statusCard: {
        marginBottom: 25,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    statusGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
    },
    statusIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statusTextContainer: { flex: 1 },
    statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statusDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 18 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    borderStrip: { width: 5 },
    cardBody: { flex: 1, padding: 15 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    dateText: { fontSize: 12, color: '#999' },

    reasonText: { fontSize: 15, color: '#333', fontWeight: '500', marginBottom: 12 },

    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },

    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusLabel: { fontSize: 12, color: '#666' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusValue: { fontSize: 12, fontWeight: 'bold' },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
    },
    infoText: { flex: 1, marginLeft: 15, color: '#1565C0', fontSize: 13, lineHeight: 18 },
});
