import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Image as RNImage,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { role: initialRole } = useLocalSearchParams();
    const { login, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');

    // Toast State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('error');

    useEffect(() => {
        if (initialRole) {
            setRole(initialRole);
        }
    }, [initialRole]);

    const showToast = (message, type = 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const validate = () => {
        if (!email) {
            showToast('Please enter your Email or Register Number');
            return false;
        }
        if (role === 'student' && !email.includes('@') && isNaN(Number(email))) {
            showToast('Enter a valid Email or Student Reg No');
            return false;
        }
        if (!password) {
            showToast('Please enter your password');
            return false;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        try {
            await login(email, password, role);
        } catch (error) {
            showToast('Login Failed. Please check your credentials.');
        }
    };

    const roles = [
        { id: 'student', label: 'Student', icon: 'graduation-cap', color: '#0056D2', bg: ['#E3F2FD', '#BBDEFB'] },
        { id: 'faculty', label: 'Faculty', icon: 'user', color: '#00A86B', bg: ['#E8F5E9', '#C8E6C9'] },
        { id: 'admin', label: 'Admin', icon: 'cogs', color: '#D32F2F', bg: ['#FFEBEE', '#FFCDD2'] },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <RNImage source={require('../assets/images/college_logo.png')} style={styles.logoImage} resizeMode="contain" />
                        </View>
                    </View>
                    <Text style={styles.collegeName}>KATHIR COLLEGE</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </Animated.View>

                {/* Role Selection */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.roleConfigContainer}>
                    <Text style={styles.roleLabel}>I am a...</Text>
                    <View style={styles.roleRow}>
                        {roles.map((r) => (
                            <Pressable
                                key={r.id}
                                style={styles.roleCardWrapper}
                                onPress={() => setRole(r.id)}
                            >
                                <LinearGradient
                                    colors={role === r.id ? r.bg : ['#fff', '#fff']}
                                    style={[
                                        styles.roleCard,
                                        role === r.id && { borderColor: r.color, borderWidth: 1.5, transform: [{ scale: 1.05 }] }
                                    ]}
                                >
                                    <View style={[
                                        styles.roleIconCircle,
                                        { backgroundColor: role === r.id ? r.color : '#f5f5f5' }
                                    ]}>
                                        <FontAwesome
                                            name={r.icon}
                                            size={18}
                                            color={role === r.id ? '#fff' : '#888'}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.roleText,
                                        role === r.id && { color: r.color, fontWeight: 'bold' }
                                    ]}>
                                        {r.label}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                            {role === 'student' ? 'Register Number / Email' : 'Email Address'}
                        </Text>
                        <View style={styles.inputWrapper}>
                            <FontAwesome name="user-o" size={20} color={roles.find(r => r.id === role)?.color || '#666'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={role === 'student' ? "71001..." : "faculty@kce.ac.in"}
                                placeholderTextColor="#aaa"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <FontAwesome name="lock" size={20} color={roles.find(r => r.id === role)?.color || '#666'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••"
                                placeholderTextColor="#aaa"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={[styles.forgotPassText, { color: roles.find(r => r.id === role)?.color }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={role === 'student' ? ['#0056D2', '#1976D2'] : role === 'faculty' ? ['#00A86B', '#388E3C'] : ['#D32F2F', '#C62828']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.submitButtonText}>Login Details</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity>
                        <Text style={[styles.signupText, { color: roles.find(r => r.id === role)?.color }]}>Contact Admin</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    logoContainer: {
        marginBottom: 15,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 70,
        height: 70,
    },
    collegeName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a237e',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
    },
    roleConfigContainer: {
        marginBottom: 25,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    roleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleCardWrapper: {
        width: '31%',
    },
    roleCard: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    roleIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    roleText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        paddingHorizontal: 15,
        height: 52,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotPassText: {
        fontWeight: '600',
        fontSize: 13,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 35,
    },
    footerText: {
        color: '#666',
        marginRight: 5,
        fontSize: 14,
    },
    signupText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});
