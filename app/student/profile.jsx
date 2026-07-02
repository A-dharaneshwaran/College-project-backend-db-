import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { api } from '../../services/api';

const INITIAL_DATA = {
    registerNumber: '',
    fullName: '',
    dob: '',
    gender: '',
    department: '',
    semester: '',
    mobileNumber: '',
    email: '',
    residentialAddress: '',

    // Father
    parentName: '',
    relationship: 'Father',
    parentMobile: '',
    parentEmail: '',
    occupation: '',
    parentAddress: '',

    // Mother
    motherName: '',
    motherMobile: '',
    motherEmail: '',
    motherOccupation: '',
    motherAddress: '',
};

export default function StudentProfile() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [sameAddress, setSameAddress] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/students/profile');
            const student = response.data;
            if (student) {
                setFormData({
                    registerNumber: student.registerNumber || '',
                    fullName: student.user?.name || '',
                    dob: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                    gender: student.gender || 'Male',
                    department: student.department?.name || '',
                    semester: student.semester ? String(student.semester) : '',
                    mobileNumber: student.phone || '',
                    email: student.user?.email || '',
                    residentialAddress: student.address || '',

                    // Father
                    parentName: student.parentDetails?.fatherName || '',
                    relationship: 'Father',
                    parentMobile: student.parentDetails?.fatherPhone || '',
                    parentEmail: '',
                    occupation: '',
                    parentAddress: student.address || '',

                    // Mother
                    motherName: student.parentDetails?.motherName || '',
                    motherMobile: student.parentDetails?.motherPhone || '',
                    motherEmail: '',
                    motherOccupation: '',
                    motherAddress: student.address || '',
                });
            }
        } catch (err) {
            console.error('Error loading student profile:', err);
            setError(err.message || 'Failed to load profile.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSave = async () => {
        if (!formData.fullName || !formData.email || !formData.mobileNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: formData.fullName,
                email: formData.email,
                phone: formData.mobileNumber,
                address: formData.residentialAddress,
                dateOfBirth: formData.dob,
                gender: formData.gender,
                parentDetails: {
                    fatherName: formData.parentName,
                    fatherPhone: formData.parentMobile,
                    motherName: formData.motherName,
                    motherPhone: formData.motherMobile
                }
            };
            await api.put('/students/profile', payload);
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => setIsEditing(false) }
            ]);
        } catch (err) {
            console.error('Error updating student profile:', err);
            Alert.alert('Error', err.message || 'Failed to save profile changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSameAddress = (value) => {
        setSameAddress(value);
        if (value) {
            setFormData(prev => ({
                ...prev,
                parentAddress: prev.residentialAddress,
                motherAddress: prev.residentialAddress
            }));
        }
    };

    const updateField = (key, value) => {
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            if (sameAddress && key === 'residentialAddress') {
                newData.parentAddress = value;
                newData.motherAddress = value;
            }
            return newData;
        });
    };

    const renderHeader = () => (
        <LinearGradient
            colors={['#0056D2', '#6A0DAD']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.headerContainer}
        >
            <View style={styles.headerContent}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{formData.fullName ? formData.fullName.charAt(0) : 'S'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerName} numberOfLines={1}>{formData.fullName || 'Student'}</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{formData.registerNumber} • {formData.department}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.editBtn}
                onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator size="small" color="#0056D2" />
                ) : (
                    <>
                        <FontAwesome name={isEditing ? "check" : "pencil"} size={16} color="#0056D2" />
                        <Text style={styles.editBtnText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
                    </>
                )}
            </TouchableOpacity>
        </LinearGradient>
    );

    const renderField = (label, field, placeholder, icon, keyboardType = 'default') => (
        <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
                <View style={[styles.labelIcon, { backgroundColor: '#E3F2FD' }]}>
                    <FontAwesome name={icon} size={14} color="#0056D2" />
                </View>
                <Text style={styles.label}>{label}</Text>
            </View>

            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={formData[field]}
                    onChangeText={(text) => updateField(field, text)}
                    placeholder={placeholder}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                />
            ) : (
                <View style={styles.valueRow}>
                    <Text style={styles.valueText}>{formData[field]}</Text>
                    {(field === 'parentMobile' || field === 'motherMobile' || field === 'mobileNumber') && (
                        <View style={styles.actionIcons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
                                onPress={() => Linking.openURL(`tel:${formData[field]}`)}
                            >
                                <FontAwesome name="phone" size={16} color="#00A86B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
                                onPress={() => Linking.openURL(`sms:${formData[field]}`)}
                            >
                                <FontAwesome name="comment" size={16} color="#FF8C00" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0056D2" />
                <Text style={{ marginTop: 10, color: '#555', fontWeight: '500' }}>Loading Profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <FontAwesome name="exclamation-triangle" size={40} color="#D32F2F" style={{ marginBottom: 15 }} />
                <Text style={{ color: '#D32F2F', textAlign: 'center', marginBottom: 15, fontSize: 14 }}>{error}</Text>
                <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0056D2', borderRadius: 8 }} onPress={loadProfile}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="#0056D2" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {renderHeader()}

                <View style={styles.contentContainer}>

                    {/* 🔹 Personal Details */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            <View style={styles.sectionLine} />
                        </View>

                        {renderField('Full Name', 'fullName', 'Enter Name', 'user')}
                        {renderField('Date of Birth', 'dob', 'YYYY-MM-DD', 'calendar')}
                        {renderField('Gender', 'gender', 'Select Gender', 'transgender')}
                        {renderField('Mobile', 'mobileNumber', 'Enter Mobile', 'mobile', 'phone-pad')}
                        {renderField('Email', 'email', 'Enter Email', 'envelope', 'email-address')}
                        {renderField('Address', 'residentialAddress', 'Enter Address', 'map-marker')}
                    </View>

                    {/* 🔹 Father Details */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Father / Guardian</Text>
                            <View style={[styles.sectionLine, { backgroundColor: '#FF8C00' }]} />
                        </View>
                        {renderField('Father Name', 'parentName', 'Enter Name', 'user')}
                        {renderField('Occupation', 'occupation', 'Enter Occupation', 'briefcase')}
                        {renderField('Mobile', 'parentMobile', 'Enter Mobile', 'phone', 'phone-pad')}
                        {renderField('Email', 'parentEmail', 'Enter Email', 'envelope', 'email-address')}

                        {!isEditing && (
                            <View style={{ flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' }}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E8F5E9', width: 120, borderRadius: 10, marginRight: 10 }]}
                                    onPress={() => Linking.openURL(`tel:${formData.parentMobile}`)}
                                >
                                    <FontAwesome name="phone" size={16} color="#00A86B" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#00A86B', fontWeight: 'bold' }}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#FFF3E0', width: 120, borderRadius: 10 }]}
                                    onPress={() => Linking.openURL(`sms:${formData.parentMobile}`)}
                                >
                                    <FontAwesome name="comment" size={16} color="#FF8C00" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#FF8C00', fontWeight: 'bold' }}>Message</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* 🔹 Mother Details */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Mother's Details</Text>
                            <View style={[styles.sectionLine, { backgroundColor: '#6A0DAD' }]} />
                        </View>
                        {renderField('Mother Name', 'motherName', 'Enter Name', 'female')}
                        {renderField('Occupation', 'motherOccupation', 'Enter Occupation', 'briefcase')}
                        {renderField('Mobile', 'motherMobile', 'Enter Mobile', 'phone', 'phone-pad')}
                        {renderField('Email', 'motherEmail', 'Enter Email', 'envelope', 'email-address')}

                        {!isEditing && (
                            <View style={{ flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' }}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E8F5E9', width: 120, borderRadius: 10, marginRight: 10 }]}
                                    onPress={() => Linking.openURL(`tel:${formData.motherMobile}`)}
                                >
                                    <FontAwesome name="phone" size={16} color="#00A86B" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#00A86B', fontWeight: 'bold' }}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#FFF3E0', width: 120, borderRadius: 10 }]}
                                    onPress={() => Linking.openURL(`sms:${formData.motherMobile}`)}
                                >
                                    <FontAwesome name="comment" size={16} color="#FF8C00" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#FF8C00', fontWeight: 'bold' }}>Message</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerContainer: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#0056D2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    editBtn: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    editBtnText: {
        color: '#0056D2',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    contentContainer: {
        padding: 20,
        marginTop: 0,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 15,
    },
    sectionLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#0056D2',
        opacity: 0.2,
        borderRadius: 1,
    },
    fieldContainer: {
        marginBottom: 18,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    valueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    valueText: {
        fontSize: 16,
        color: '#222',
        fontWeight: '500',
        flex: 1,
    },
    input: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 16,
        color: '#333',
    },
    actionIcons: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});
