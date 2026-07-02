import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const DEPARTMENTS = [
    { id: 'cse', name: 'Computer Science', code: 'CSE', icon: 'laptop', colors: ['#0056D2', '#42A5F5'] },
    { id: 'ece', name: 'Electronics & Comm', code: 'ECE', icon: 'microchip', colors: ['#FF8C00', '#FFB74D'] },
    { id: 'eee', name: 'Electrical & Electronics', code: 'EEE', icon: 'bolt', colors: ['#6A0DAD', '#AB47BC'] },
    { id: 'mech', name: 'Mechanical Engg', code: 'MECH', icon: 'cogs', colors: ['#00A86B', '#66BB6A'] },
    { id: 'civil', name: 'Civil Engineering', code: 'CIVIL', icon: 'building', colors: ['#D32F2F', '#FF7043'] },
    { id: 'aids', name: 'AI & Data Science', code: 'AIDS', icon: 'sitemap', colors: ['#311B92', '#7E57C2'] },
];

const FEATURES = [
    { icon: 'graduation-cap', title: 'Top Faculty', desc: 'Learn from industry experts.' },
    { icon: 'globe', title: 'Global', desc: 'International tie-ups.' },
    { icon: 'briefcase', title: 'Placements', desc: '100% Career support.' },
];

const STATS = [
    { label: 'Students', value: '2500+' },
    { label: 'Faculty', value: '150+' },
    { label: 'Placement', value: '98%' },
];

// 🎨 Reusable Hover Card
const HoverCard = ({ children, style, onPress }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
    }));

    const handleHoverIn = () => {
        scale.value = withSpring(1.05);
        shadowOpacity.value = withTiming(0.25);
    };

    const handleHoverOut = () => {
        scale.value = withSpring(1);
        shadowOpacity.value = withTiming(0.1);
    };

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPressIn={() => scale.value = withSpring(0.98)}
            onPressOut={() => scale.value = withSpring(1)}
            style={({ pressed }) => [style, Platform.OS === 'web' && { cursor: 'pointer' }]}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    const handleLoginPress = () => setModalVisible(true);
    const handleRoleSelect = (role) => {
        setModalVisible(false);
        router.push(`/login?role=${role}`);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* 🔷 Sticky Navbar */}
            <LinearGradient
                colors={['#0056D2', '#003c8f']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.navbar}
            >
                <View style={styles.navLogoContainer}>
                    <Image source={require('../assets/images/college_logo.png')} style={styles.navLogo} resizeMode="contain" />
                    <Text style={styles.navTitle}>KATHIR COLLEGE</Text>
                </View>
                <TouchableOpacity onPress={handleLoginPress} style={styles.navLoginBtn}>
                    <Text style={styles.navLoginText}>Login</Text>
                    <FontAwesome name="arrow-right" size={14} color="#0056D2" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 🔷 HERO SECTION */}
                <View style={styles.heroContainer}>
                    <Image
                        source={require('../assets/images/college_hero.png')}
                        style={styles.heroBg}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={styles.heroOverlay}
                    />

                    <View style={styles.heroContent}>
                        <Animated.View entering={ZoomIn.duration(1000).springify()} style={styles.logoWrapper}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
                                style={styles.logoGlow}
                            />
                            <Image source={require('../assets/images/college_logo.png')} style={styles.mainLogo} resizeMode="contain" />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.titleWrapper}>
                            <Text style={styles.collegeName}>KATHIR COLLEGE OF ENGINEERING</Text>
                            <View style={styles.divider} />
                            <Text style={styles.tagline}>“Inspiring Excellence • Empowering Learners”</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.actionContainer}>
                            <HoverCard style={{ marginBottom: 15 }} onPress={handleLoginPress}>
                                <LinearGradient
                                    colors={['#0056D2', '#6A0DAD']} // Blue -> Purple
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.primaryBtn}
                                >
                                    <Text style={styles.btnText}>Student / Faculty Login</Text>
                                    <FontAwesome name="sign-in" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </HoverCard>

                            <HoverCard onPress={() => { }}>
                                <LinearGradient
                                    colors={['#FF8C00', '#00A86B']} // Orange -> Green
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.secondaryBtn}
                                >
                                    <Text style={styles.btnText}>Explore Departments</Text>
                                    <FontAwesome name="compass" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </HoverCard>
                        </Animated.View>
                    </View>
                </View>

                {/* 🔷 QUICK STATS BAR */}
                <Animated.View entering={FadeInUp.delay(800).springify()} style={styles.statsContainer}>
                    {STATS.map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* 🔷 DEPARTMENTS */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.titleRow}>
                            <View style={styles.titleBar} />
                            <Text style={styles.sectionTitle}>Our Departments</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>Discover our world-class academic programs</Text>
                    </View>

                    <View style={styles.deptGrid}>
                        {DEPARTMENTS.map((dept, index) => (
                            <Animated.View key={dept.id} entering={FadeInDown.delay(index * 100 + 400).springify()} style={styles.deptCardWrapper}>
                                <HoverCard style={styles.deptCardShadow}>
                                    <LinearGradient
                                        colors={dept.colors}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={styles.deptCard}
                                    >
                                        <View style={styles.deptIconCircle}>
                                            <FontAwesome name={dept.icon} size={28} color={dept.colors[0]} />
                                        </View>
                                        <View>
                                            <Text style={styles.deptCode}>{dept.code}</Text>
                                            <Text style={styles.deptName}>{dept.name}</Text>
                                        </View>
                                        <View style={styles.deptGlow} />
                                    </LinearGradient>
                                </HoverCard>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                {/* 🔷 WHY CHOOSE US */}
                <View style={[styles.sectionContainer, styles.bgLight]}>
                    <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 30 }]}>Why Choose Kathir?</Text>
                    <View style={styles.featuresRow}>
                        {FEATURES.map((feature, index) => (
                            <HoverCard key={index} style={styles.featureItem}>
                                <LinearGradient
                                    colors={['#e3f2fd', '#fff']}
                                    style={styles.featureGradient}
                                >
                                    <View style={styles.featureIconCircle}>
                                        <FontAwesome name={feature.icon} size={24} color="#0056D2" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.featureTitle}>{feature.title}</Text>
                                        <Text style={styles.featureDesc}>{feature.desc}</Text>
                                    </View>
                                </LinearGradient>
                            </HoverCard>
                        ))}
                    </View>
                </View>

                {/* 🔷 FOOTER */}
                <View style={styles.footer}>
                    <LinearGradient
                        colors={['#1a1a1a', '#000']}
                        style={styles.footerGradient}
                    >
                        <Text style={styles.footerText}>© 2026 Kathir College of Engineering</Text>
                        <Text style={styles.footerSubText}>Coimbatore, Tamil Nadu • Est. 2008</Text>
                    </LinearGradient>
                </View>
            </ScrollView>

            {/* Login Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={ZoomIn.duration(300)} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Portal</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {['Student', 'Faculty', 'Admin'].map((role, idx) => (
                            <HoverCard
                                key={role}
                                onPress={() => handleRoleSelect(role.toLowerCase())}
                                style={styles.roleCard}
                            >
                                <LinearGradient
                                    colors={role === 'Student' ? ['#e3f2fd', '#fff'] : role === 'Faculty' ? ['#e8f5e9', '#fff'] : ['#fff3e0', '#fff']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.roleGradient}
                                >
                                    <View style={[styles.roleIcon, {
                                        backgroundColor: role === 'Student' ? '#1565c0' : role === 'Faculty' ? '#2e7d32' : '#ef6c00'
                                    }]}>
                                        <FontAwesome
                                            name={role === 'Student' ? 'graduation-cap' : role === 'Faculty' ? 'user' : 'cog'}
                                            size={20}
                                            color="#fff"
                                        />
                                    </View>
                                    <View style={styles.roleTextContainer}>
                                        <Text style={styles.roleTitle}>{role} Login</Text>
                                        <Text style={styles.roleSub}>Access dashboard</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                                </LinearGradient>
                            </HoverCard>
                        ))}
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    // Navbar
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? 40 : 12, // Status bar clear
        elevation: 8,
        zIndex: 100,
    },
    navLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navLogo: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    navTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    navLoginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 4,
    },
    navLoginText: {
        color: '#0056D2',
        fontWeight: 'bold',
        fontSize: 13,
    },
    // Hero
    heroContainer: {
        height: 600,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroBg: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
        width: '100%',
    },
    logoWrapper: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    mainLogo: {
        width: 130,
        height: 130,
        marginBottom: 10,
    },
    titleWrapper: {
        alignItems: 'center',
        marginBottom: 40,
    },
    collegeName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1.5,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
        lineHeight: 44,
    },
    divider: {
        width: 100,
        height: 5,
        backgroundColor: '#FF8C00',
        marginVertical: 20,
        borderRadius: 3,
    },
    tagline: {
        fontSize: 18,
        color: '#E0E0E0',
        fontStyle: 'italic',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    actionContainer: {
        width: '100%',
        alignItems: 'center',
    },
    primaryBtn: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 50,
        alignItems: 'center',
        minWidth: 280,
        justifyContent: 'center',
        elevation: 6,
    },
    secondaryBtn: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 50,
        alignItems: 'center',
        minWidth: 280,
        justifyContent: 'center',
        elevation: 6,
    },
    btnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Stats
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -50,
        marginBottom: 40,
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0056D2',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Departments
    sectionContainer: {
        marginBottom: 40,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleBar: {
        width: 6,
        height: 30,
        backgroundColor: '#0056D2',
        marginRight: 10,
        borderRadius: 3,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        marginLeft: 16,
    },
    deptGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    deptCardWrapper: {
        width: COLUMN_WIDTH,
        marginBottom: 20,
    },
    deptCardShadow: {
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        backgroundColor: '#fff',
    },
    deptCard: {
        borderRadius: 20,
        padding: 20,
        height: 180,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    deptIconCircle: {
        width: 55,
        height: 55,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    deptCode: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    deptName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    deptGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    // Features
    bgLight: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 50,
        marginHorizontal: 0,
    },
    featuresRow: {
        paddingHorizontal: 20,
    },
    featureItem: {
        marginBottom: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    featureGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
    },
    featureIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: '#e3f2fd',
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0056D2',
        marginBottom: 6,
    },
    featureDesc: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    // Footer
    footer: {
        marginTop: 0,
    },
    footerGradient: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    footerSubText: {
        fontSize: 12,
        color: '#888',
        marginTop: 6,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    roleCard: {
        marginBottom: 15,
        borderRadius: 15,
        elevation: 2,
    },
    roleGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    roleIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    roleTextContainer: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    roleSub: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
});
