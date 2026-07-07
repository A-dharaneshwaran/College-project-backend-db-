import { Stack } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

export default function StudentLayout() {
    const { user, isLoading, logout } = useAuth();

    if (isLoading || !user || user.role !== 'student') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
                <ActivityIndicator size="large" color="#1a237e" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{
            headerStyle: { backgroundColor: '#1a237e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 }}>
                    <NotificationBell role="student" color="#fff" />
                    <TouchableOpacity onPress={logout}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )
        }}>
            <Stack.Screen name="index" options={{ title: 'Student Dashboard' }} />
            <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
            <Stack.Screen name="academics" options={{ title: 'Academic Details' }} />
            <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
            <Stack.Screen name="discipline" options={{ title: 'Discipline History' }} />
            <Stack.Screen name="query" options={{ title: 'Helpdesk Queries' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notification Center' }} />
            <Stack.Screen name="messages" options={{ title: 'My Messages' }} />
            <Stack.Screen name="contact" options={{ title: 'Contact Directory' }} />
        </Stack>
    );
}
