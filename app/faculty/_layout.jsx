import { Stack } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

export default function FacultyLayout() {
    const { user, isLoading, logout } = useAuth();

    if (isLoading || !user || user.role !== 'faculty') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
                <ActivityIndicator size="large" color="#2e7d32" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{
            headerStyle: { backgroundColor: '#2e7d32' }, // Green for Faculty
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 }}>
                    <NotificationBell role="faculty" color="#fff" />
                    <TouchableOpacity onPress={logout}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )
        }}>
            <Stack.Screen name="index" options={{ title: 'Faculty Dashboard' }} />
            <Stack.Screen name="profile" options={{ title: 'Faculty Profile' }} />
            <Stack.Screen name="students" options={{ title: 'Student List' }} />
            <Stack.Screen name="discipline" options={{ title: 'Discipline Reporting' }} />
            <Stack.Screen name="updates" options={{ title: 'Campus Updates' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notification Center' }} />
            <Stack.Screen name="messages" options={{ title: 'Inbox' }} />
        </Stack>
    );
}
