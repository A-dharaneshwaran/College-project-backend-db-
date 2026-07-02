import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { api, setAuthToken, removeAuthToken, getAuthToken, setOnUnauthorized } from '../services/api';

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Subscribe to global 401 unauthorized events from API client
        setOnUnauthorized(() => {
            setUser(null);
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
        });

        // Multi-tab storage synchronization for web browsers
        let handleStorageChange;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            handleStorageChange = async (e) => {
                const token = await getAuthToken();
                if (!token) {
                    setUser(null);
                }
            };
            window.addEventListener('storage', handleStorageChange);
        }

        const initializeAuth = async () => {
            try {
                const token = await getAuthToken();
                if (token) {
                    const response = await api.get('/auth/me');
                    // In backend response, the user record is inside response.data
                    setUser(response.data);
                }
            } catch (error) {
                console.log('Failed to restore auth session:', error);
                await removeAuthToken();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        return () => {
            if (handleStorageChange && typeof window !== 'undefined') {
                window.removeEventListener('storage', handleStorageChange);
            }
        };
    }, []);

    const login = async (email, password, role) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: loggedInUser } = response.data;
            
            // Check that the returned role matches the selected role
            if (loggedInUser.role !== role) {
                throw new Error(`Unauthorized role access. Account is registered as: ${loggedInUser.role}`);
            }

            await setAuthToken(token);
            setUser(loggedInUser);
            setIsLoading(false);
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await removeAuthToken();
        setUser(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
