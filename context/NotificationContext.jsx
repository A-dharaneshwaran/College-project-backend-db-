import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, hasNext: false });
  
  const appState = useRef(AppState.currentState);

  // Fetch only unread count (for the bell)
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      const unread = res?.count ?? res?.data?.count ?? 0;
      setUnreadCount(unread);
    } catch (err) {
      console.log('Failed to fetch unread count:', err);
    }
  }, [user]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async (params = { page: 1, limit: 20 }, append = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const queryStr = Object.keys(params)
        .filter(k => params[k] !== undefined && params[k] !== '')
        .map(k => `${k}=${encodeURIComponent(params[k])}`)
        .join('&');
        
      const res = await api.get(`/notifications?${queryStr}`);
      const { data, pagination: pag } = res?.data || {};
      
      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setPagination(pag);
      
      // Update count silently when we fetch full list
      refreshUnreadCount();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, refreshUnreadCount]);

  // Mark single read
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log('Failed to mark read', err);
    }
  };

  // Mark all read
  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log('Failed to mark all read', err);
    }
  };

  // Delete single
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      refreshUnreadCount();
    } catch (err) {
      console.log('Failed to delete notification', err);
    }
  };

  // Clear read
  const clearRead = async () => {
    try {
      await api.delete('/notifications/clear-read');
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (err) {
      console.log('Failed to clear read notifications', err);
    }
  };

  // AppState listener for foreground resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      pagination,
      fetchNotifications,
      markRead,
      markAllRead,
      deleteNotification,
      clearRead,
      refreshUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
