import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function StudentAcademics() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/marks/my');
            setSummary(res.data?.summary || {
                semesterResults: [],
                overallCgpa: 8.5,
                totalCredits: 124,
                backlogs: 0
            });
        } catch (err) {
            console.error('Error fetching academic marks:', err);
            setError(err.message || 'Failed to load academic records.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0056D2" />
                <Text style={styles.loadingText}>Loading Academic Records...</Text>
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

    const semesters = summary?.semesterResults || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0056D2', '#003c8f']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Academic Performance</Text>
                <Text style={styles.headerSubtitle}>CGPA & Semester Results</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* CGPA Card */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.cgpaCard}>
                    <LinearGradient
                        colors={['#FF8C00', '#FFB74D']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.cgpaGradient}
                    >
                        <View>
                            <Text style={styles.cgpaLabel}>Current CGPA</Text>
                            <Text style={styles.cgpaValue}>{summary?.overallCgpa || '8.5'}</Text>
                            <Text style={styles.cgpaSub}>Total Credits: {summary?.totalCredits || '124'}</Text>
                        </View>
                        <View style={styles.trophyIcon}>
                            <FontAwesome name="trophy" size={50} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.sectionTitle}>Semester History</Text>

                {semesters.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No academic results found</Text>
                    </View>
                ) : (
                    semesters.map((s, index) => (
                        <Animated.View
                            key={s.sem}
                            entering={FadeInDown.delay(index * 100 + 300)}
                            style={styles.card}
                        >
                            <View style={styles.cardLeft}>
                                <View style={styles.semBadge}>
                                    <Text style={styles.semBadgeText}>{s.sem}</Text>
                                </View>
                                <View>
                                    <Text style={styles.semTitle}>Semester {s.sem}</Text>
                                    <Text style={styles.semCredits}>{s.credits} Credits • {s.status}</Text>
                                </View>
                            </View>
                            <View style={styles.gpaContainer}>
                                <Text style={styles.gpaLabel}>GPA</Text>
                                <Text style={styles.gpaText}>{s.gpa}</Text>
                            </View>
                        </Animated.View>
                    ))
                )}
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
        shadowColor: '#0056D2',
        shadowOpacity: 0.3,
        marginBottom: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    scrollContent: { padding: 20, paddingTop: 10 },

    cgpaCard: {
        borderRadius: 20,
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cgpaGradient: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cgpaLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
    cgpaValue: { color: '#fff', fontSize: 42, fontWeight: '900', marginVertical: 4 },
    cgpaSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    trophyIcon: { opacity: 0.8 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    semBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    semBadgeText: { fontSize: 18, fontWeight: 'bold', color: '#0056D2' },
    semTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    semCredits: { fontSize: 13, color: '#666', marginTop: 2 },
    gpaContainer: { alignItems: 'flex-end' },
    gpaLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
    gpaText: { fontSize: 20, fontWeight: 'bold', color: '#0056D2' },
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
    emptyCard: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
});
