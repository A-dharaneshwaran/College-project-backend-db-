import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

import { MessageProvider } from '../context/MessageContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <MessageProvider>
          <RootLayoutNav />
        </MessageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return;
    if (!rootNavigationState?.key) return; // Wait for navigation to be ready

    const inAuthGroup = segments[0] === 'student' || segments[0] === 'faculty' || segments[0] === 'admin';
    const isLoginPage = segments[0] === 'login';
    const isRoot = segments.length === 0; // index.tsx

    if (!user) {
      // If not logged in and trying to access protected routes, redirect to login
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      // If logged in
      if (isLoginPage || isRoot) {
        // Redirect to specific dashboard based on role
        router.replace(`/${user.role}`);
      } else if (inAuthGroup) {
        // Prevent cross-role access
        // e.g. student accessing /admin
        if (segments[0] !== user.role) {
          router.replace(`/${user.role}`);
        }
      }
    }
  }, [user, isLoading, segments, rootNavigationState?.key]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            title: '',
            headerTransparent: true,
            headerShadowVisible: false,
            headerTintColor: '#1a237e',
            headerLeft: (props) => (
              <HeaderBackButton
                {...props}
                tintColor="#1a237e"
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/');
                  }
                }}
              />
            ),
          }}
        />
        <Stack.Screen name="student" options={{ headerShown: false }} />
        <Stack.Screen name="faculty" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </ThemeProvider>
  );
}
