import { Stack } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import NotificationBell from '../../components/NotificationBell';

export default function AdminLayout() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    if (isLoading || !user || user.role !== 'admin') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
                <ActivityIndicator size="large" color="#c62828" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{
            headerStyle: { backgroundColor: '#c62828' }, // Red for Admin
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 }}>
                    <NotificationBell role="admin" color="#fff" />
                    <TouchableOpacity
                        onPress={() => router.push('/admin/global-search')}
                        style={{ padding: 4 }}
                        accessibilityLabel="Open global search"
                    >
                        <Ionicons name="search" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )
        }}>
            <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="manage-students" options={{ title: 'Manage Students' }} />
            <Stack.Screen name="manage-faculty" options={{ title: 'Manage Faculty' }} />
            <Stack.Screen name="departments" options={{ title: 'Department Management' }} />
            <Stack.Screen name="discipline" options={{ title: 'Discipline Governance' }} />
            <Stack.Screen name="illegal-activities" options={{ title: 'Regulatory Breaches' }} />
            <Stack.Screen name="activity-history" options={{ title: 'System Activity Logs' }} />
            <Stack.Screen
                name="global-search"
                options={{
                    title: 'Global Search',
                    headerShown: false,  // The screen manages its own header for full-width search bar
                }}
            />
            <Stack.Screen name="notifications" options={{ title: 'Notification Center' }} />
            <Stack.Screen name="analytics" options={{ title: 'Institutional Analytics' }} />
            <Stack.Screen name="messages" options={{ title: 'Internal Messaging' }} />
        </Stack>
    );
}

