import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function StudentAchievements() {
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAchievements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/achievements/my');
            setAchievements(response.data || []);
        } catch (err) {
            console.error('Error loading achievements:', err);
            setError(err.message || 'Failed to load achievements.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAchievements();
    }, []);

    const getTypeDetails = (type) => {
        switch (type?.toLowerCase()) {
            case 'technical':
                return { icon: 'trophy', isMaterial: false, color: '#FFD700', label: 'Technical' };
            case 'academic':
                return { icon: 'star', isMaterial: false, color: '#00A86B', label: 'Academic' };
            case 'sports':
                return { icon: 'hand-heart', isMaterial: true, color: '#FF5722', label: 'Sports' };
            case 'cultural':
                return { icon: 'file-document-outline', isMaterial: true, color: '#2962FF', label: 'Cultural' };
            default:
                return { icon: 'trophy', isMaterial: false, color: '#8E24AA', label: 'Other' };
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6A0DAD" />
                <Text style={{ marginTop: 10, color: '#555', fontWeight: '500' }}>Loading Achievements...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <FontAwesome name="exclamation-triangle" size={40} color="#D32F2F" style={{ marginBottom: 15 }} />
                <Text style={{ color: '#D32F2F', textAlign: 'center', marginBottom: 15 }}>{error}</Text>
                <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6A0DAD', borderRadius: 8 }} onPress={loadAchievements}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const badgeCount = String(achievements.length).padStart(2, '0');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#6A0DAD', '#4A148C']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Achievements</Text>
                <Text style={styles.headerSubtitle}>Hall of Fame & Certifications</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Summary Card */}
                <Animated.View entering={ZoomIn.duration(600)} style={styles.summaryCard}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA000']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.summaryGradient}
                    >
                        <View>
                            <Text style={styles.summaryLabel}>Total Badges</Text>
                            <Text style={styles.summaryCount}>{badgeCount}</Text>
                        </View>
                        <View style={styles.trophyContainer}>
                            <FontAwesome name="trophy" size={40} color="#fff" />
                        </View>
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.sectionTitle}>Recent Awards</Text>

                {achievements.length === 0 ? (
                    <View style={{ backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontSize: 14 }}>No achievements recorded yet</Text>
                    </View>
                ) : (
                    achievements.map((item, index) => {
                        const details = getTypeDetails(item.type);
                        const dateFormatted = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
                        return (
                            <Animated.View
                                key={item._id || item.id || String(index)}
                                entering={FadeInDown.delay(index * 150).springify()}
                                style={styles.card}
                            >
                                <View style={[styles.iconBox, { backgroundColor: details.color + '20' }]}>
                                    {details.isMaterial ? (
                                        <MaterialCommunityIcons name={details.icon} size={24} color={details.color} />
                                    ) : (
                                        <FontAwesome name={details.icon} size={24} color={details.color} />
                                    )}
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.dateBadge}>
                                            <Text style={styles.dateText}>{dateFormatted}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardDesc}>{item.description}</Text>
                                    <View style={[styles.catBadge, { borderColor: details.color }]}>
                                        <Text style={[styles.catText, { color: details.color }]}>{details.label}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })
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
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    content: { padding: 20 },

    summaryCard: {
        marginBottom: 25,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#FFA000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    summaryGradient: {
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
    summaryCount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    trophyContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    dateBadge: { backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    dateText: { fontSize: 10, color: '#666', fontWeight: '600' },
    cardDesc: { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 18 },
    catBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
    catText: { fontSize: 10, fontWeight: 'bold' },
});
