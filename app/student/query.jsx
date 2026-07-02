import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../services/api';

export default function StudentQuery() {
    const router = useRouter();
    const [category, setCategory] = useState('Academic');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    const [queries, setQueries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const loadQueries = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/queries/my');
            setQueries(response.data || []);
        } catch (err) {
            console.error('Error loading queries:', err);
            setError(err.message || 'Failed to load queries.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQueries();
    }, []);

    const handleSubmit = async () => {
        if (!subject || !message) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/queries', {
                category,
                subject,
                description: message
            });
            Alert.alert('Query Submitted', `Your ticket has been raised. ID: #${response.data?._id?.substring(18) || 'TKT'}`);
            setSubject('');
            setMessage('');
            loadQueries(); // reload list
        } catch (err) {
            console.error('Error raising query:', err);
            Alert.alert('Error', err.message || 'Failed to submit query.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
                return { bg: '#E8F5E9', text: '#2E7D32' };
            case 'in-progress':
                return { bg: '#E3F2FD', text: '#1565C0' };
            default:
                return { bg: '#FFF3E0', text: '#EF6C00' };
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#FF8C00', '#F57C00']} // Orange Theme for Queries
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <FontAwesome name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <Text style={styles.headerSubtitle}>Raise a ticket for any issues</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Animated.View entering={FadeInDown.duration(600)} style={styles.formCard}>
                    <Text style={styles.label}>Select Category</Text>
                    <View style={styles.catRow}>
                        {['Academic', 'Hostel', 'Transport', 'Accounts', 'Library', 'Other'].map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.catChip, category === c && styles.catActive]}
                                onPress={() => setCategory(c)}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Subject</Text>
                    <View style={styles.inputWrapper}>
                        <FontAwesome name="tag" size={16} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Brief subject of your query..."
                            value={subject}
                            onChangeText={setSubject}
                            editable={!isSubmitting}
                        />
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your issue in detail..."
                            multiline
                            numberOfLines={5}
                            value={message}
                            onChangeText={setMessage}
                            editable={!isSubmitting}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitBtnContainer} onPress={handleSubmit} disabled={isSubmitting}>
                        <LinearGradient
                            colors={['#0056D2', '#1565C0']}
                            style={styles.submitBtn}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.submitBtnText}>Submit Query</Text>
                                    <FontAwesome name="paper-plane" size={16} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Ticket History Section */}
                <Text style={[styles.label, { marginTop: 25, marginBottom: 15 }]}>Ticket History</Text>
                
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FF8C00" style={{ marginVertical: 20 }} />
                ) : error ? (
                    <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' }}>
                        <Text style={{ color: '#D32F2F', fontSize: 13, marginBottom: 10 }}>{error}</Text>
                        <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF8C00', borderRadius: 6 }} onPress={loadQueries}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : queries.length === 0 ? (
                    <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#888', fontSize: 13 }}>No support tickets raised yet.</Text>
                    </View>
                ) : (
                    queries.map((item, index) => {
                        const statusDetails = getStatusColor(item.status);
                        const dateString = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                        return (
                            <Animated.View
                                key={item._id || String(index)}
                                entering={FadeInDown.delay(index * 100).springify()}
                                style={[styles.formCard, { marginTop: 15, padding: 18 }]}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <View style={{ backgroundColor: '#ECEFF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#546E7A' }}>{item.category.toUpperCase()}</Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#999' }}>{dateString}</Text>
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>{item.subject}</Text>
                                <Text style={{ fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 }}>{item.description}</Text>
                                
                                {item.response ? (
                                    <View style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#0056D2' }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0056D2', marginBottom: 2 }}>RESPONSE:</Text>
                                        <Text style={{ fontSize: 12, color: '#444', lineHeight: 16 }}>{item.response}</Text>
                                    </View>
                                ) : null}

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 11, color: '#888' }}>ID: #{item._id?.substring(18)}</Text>
                                    <View style={{ backgroundColor: statusDetails.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: statusDetails.text }}>
                                            {item.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })
                )}

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
        shadowColor: '#FF8C00',
        shadowOpacity: 0.3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: { marginRight: 20, padding: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    scrollContent: { padding: 20 },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        marginTop: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    catActive: {
        backgroundColor: '#FF8C00',
        borderColor: '#FF8C00',
    },
    catText: { fontSize: 13, color: '#555', fontWeight: '500' },
    catTextActive: { color: '#fff', fontWeight: 'bold' },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#333',
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 5,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitBtnContainer: {
        marginTop: 10,
        shadowColor: '#0056D2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 14,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
