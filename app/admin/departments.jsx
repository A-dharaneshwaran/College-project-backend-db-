import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function AdminDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/departments');
            setDepartments(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            Alert.alert('Error', 'Failed to fetch departments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const getDeptColor = (index) => {
        const colors = ['#1A237E', '#E65100', '#1B5E20', '#B71C1C', '#4A148C', '#006064'];
        return colors[index % colors.length];
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
                colors={['#D32F2F', '#B71C1C']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Departments</Text>
                <Text style={styles.headerSubtitle}>Manage Departments & Heads</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {departments.map((dept, index) => {
                        const color = getDeptColor(index);
                        const hodName = dept.hod?.user?.name || 'Vacant';
                        const studentCount = dept.students?.length || 0;
                        const facultyCount = dept.faculty?.length || 0;

                        return (
                            <Animated.View
                                key={dept._id}
                                entering={ZoomIn.delay(index * 100)}
                                style={styles.cardWrapper}
                            >
                                <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                                    <View style={[styles.colorStrip, { backgroundColor: color }]} />
                                    <View style={styles.cardBody}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                                                <Text style={[styles.deptCode, { color: color }]}>{dept.code}</Text>
                                            </View>
                                            <TouchableOpacity>
                                                <MaterialIcons name="more-vert" size={24} color="#999" />
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={styles.deptName} numberOfLines={1}>{dept.name}</Text>
                                        <View style={styles.hodRow}>
                                            <FontAwesome name="user" size={12} color="#666" />
                                            <Text style={styles.hodName}>{hodName}</Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.statsRow}>
                                            <View style={styles.stat}>
                                                <Text style={styles.statVal}>{studentCount}</Text>
                                                <Text style={styles.statLbl}>Students</Text>
                                            </View>
                                            <View style={styles.stat}>
                                                <Text style={styles.statVal}>{facultyCount}</Text>
                                                <Text style={styles.statLbl}>Faculty</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.fab}>
                <LinearGradient
                    colors={['#D32F2F', '#B71C1C']}
                    style={styles.fabGradient}
                >
                    <MaterialIcons name="add" size={30} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
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

    content: { padding: 15, paddingBottom: 80 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWrapper: { width: '48%', marginBottom: 15 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        height: 190,
    },
    colorStrip: { height: 6, width: '100%' },
    cardBody: { padding: 12, flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    iconBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    deptCode: { fontSize: 12, fontWeight: 'bold' },

    deptName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
    hodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    hodName: { fontSize: 11, color: '#666', marginLeft: 6 },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statLbl: { fontSize: 10, color: '#888' },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
