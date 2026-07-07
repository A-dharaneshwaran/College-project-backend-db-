import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const pollingRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const fetchConversations = useCallback(async (abortController = null) => {
    if (!user) return;
    try {
      const config = abortController ? { signal: abortController.signal } : {};
      const archivedParam = showArchived ? '&archived=true' : '';
      const response = await api.get(`/messages/conversations?limit=50${archivedParam}`, config);
      if (response?.success || response?.data) {
        const data = response?.data || response;
        setConversations(data);
        
        // Calculate total unread
        const total = data.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Failed to fetch conversations:', error);
      }
    }
  }, [user, showArchived]);

  const startPolling = useCallback(() => {
    if (pollingRef.current || !user) return;
    if (process.env.NODE_ENV === 'test' || (typeof window !== 'undefined' && window.__QA_MODE__)) return;
    setIsPolling(true);
    
    // Initial fetch immediately
    fetchConversations();
    
    pollingRef.current = setInterval(() => {
      if (appState.current === 'active') {
        fetchConversations();
      }
    }, 5000); // Poll every 5s
  }, [fetchConversations, user]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Effect to restart polling or fetch immediately when showArchived changes
  useEffect(() => {
    if (user) {
      if (isPolling) {
        stopPolling();
        startPolling();
      } else {
        fetchConversations();
      }
    }
  }, [showArchived, user, isPolling, startPolling, stopPolling]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      if (nextAppState !== 'active') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        // Only restart polling if we were supposed to be polling
        if (isPolling) startPolling();
      }
    });

    return () => {
      subscription.remove();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isPolling, startPolling]);

  // Expose manual refresh to trigger immediately after actions
  const refreshMessages = () => {
    fetchConversations();
  };

  const pinConversation = async (id) => {
    try {
      await api.put(`/messages/conversations/${id}/pin`);
      refreshMessages();
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  };

  const archiveConversation = async (id) => {
    try {
      await api.put(`/messages/conversations/${id}/archive`);
      refreshMessages();
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  return (
    <MessageContext.Provider value={{
      conversations,
      unreadCount,
      refreshMessages,
      startPolling,
      stopPolling,
      showArchived,
      setShowArchived,
      pinConversation,
      archiveConversation
    }}>
      {children}
    </MessageContext.Provider>
  );
};

