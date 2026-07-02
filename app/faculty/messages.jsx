import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Modal, Pressable, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useLocalSearchParams } from 'expo-router';
import ConversationList from '../../components/chat/ConversationList';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import SearchBar from '../../components/chat/SearchBar';

// Helper to format date headers
const getDateHeaderText = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (msgDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (msgDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};

// Helper to add date separators into the messages list
const addDateHeaders = (msgs) => {
  if (!msgs || msgs.length === 0) return [];
  const result = [];
  
  for (let i = 0; i < msgs.length; i++) {
    const currentMsg = msgs[i];
    result.push(currentMsg);
    
    const currentDate = new Date(currentMsg.createdAt);
    const nextMsg = msgs[i + 1];
    
    if (nextMsg) {
      const nextDate = new Date(nextMsg.createdAt);
      if (currentDate.toDateString() !== nextDate.toDateString()) {
        result.push({
          _id: `date-sep-${currentMsg._id}`,
          isDateHeader: true,
          dateText: getDateHeaderText(currentMsg.createdAt)
        });
      }
    } else {
      // Last message in inverted list (oldest)
      result.push({
        _id: `date-sep-${currentMsg._id}`,
        isDateHeader: true,
        dateText: getDateHeaderText(currentMsg.createdAt)
      });
    }
  }
  return result;
};

export default function FacultyMessagesScreen() {
  const { user } = useAuth();
  const { conversations, refreshMessages, startPolling, stopPolling, showArchived, setShowArchived } = useMessages();
  const { conversationId } = useLocalSearchParams();
  
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Message Actions state
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);

  // Auto scroll and new message states
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMessagesBtn, setShowNewMessagesBtn] = useState(false);
  
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const flatListRef = useRef();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (conversationId) {
      refreshMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const found = conversations.find(c => c._id === conversationId);
      if (found) {
        setActiveConversation(found);
      }
    }
  }, [conversationId, conversations]);

  // Debounced search users
  useEffect(() => {
    if (!userQuery.trim()) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.get(`/messages/search-users?q=${encodeURIComponent(userQuery)}`);
        if (res.success) {
          setUserResults(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [userQuery]);

  const handleStartChat = async (targetUser) => {
    try {
      const res = await api.post('/messages/conversations', {
        type: 'direct',
        participants: [targetUser.userId]
      });
      if (res.success) {
        setActiveConversation(res.data);
        setUserQuery('');
        setUserResults([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start conversation');
    }
  };
  
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Poll messages every 5s when conversation is active
  useEffect(() => {
    let interval = null;
    if (activeConversation) {
      loadMessages();
      markAsRead();
      
      interval = setInterval(() => {
        pollMessages();
      }, 5000);
    } else {
      setMessages([]);
      setReplyingTo(null);
      setEditingMessage(null);
      setForwardingMessage(null);
      setShowNewMessagesBtn(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeConversation]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/${activeConversation._id}`);
      if (res.success) {
        setMessages(res.data);
        setIsNearBottom(true);
        setShowNewMessagesBtn(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollMessages = async () => {
    if (!activeConversation) return;
    try {
      const res = await api.get(`/messages/${activeConversation._id}`);
      if (res.success) {
        setMessages(prev => {
          if (res.data.length > 0 && (prev.length === 0 || res.data[0]._id !== prev[0]._id)) {
            if (!isNearBottom) {
              setShowNewMessagesBtn(true);
            } else {
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              }, 100);
            }
            return res.data;
          }
          // If message counts are same but content isEdited/isDeleted changes, sync list
          const hasUpdates = res.data.some((m, idx) => {
            const prevM = prev[idx];
            return !prevM || prevM.isEdited !== m.isEdited || prevM.isDeleted !== m.isDeleted;
          });
          if (hasUpdates) {
            return res.data;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async () => {
    if (!activeConversation) return;
    try {
      await api.put('/messages/read-all', { conversationId: activeConversation._id });
      refreshMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (content) => {
    if (!activeConversation) return;
    setSending(true);
    try {
      if (editingMessage) {
        // Edit Message Flow
        const res = await api.put(`/messages/${editingMessage._id}`, { content });
        if (res.success) {
          setMessages(prev => prev.map(m => m._id === res.data._id ? res.data : m));
          setEditingMessage(null);
          refreshMessages();
        }
      } else {
        // Send / Reply Message Flow
        const payload = { content, type: 'text' };
        if (replyingTo) {
          payload.replyTo = replyingTo._id;
        }
        const res = await api.post(`/messages/${activeConversation._id}`, payload);
        if (res.success) {
          setMessages(prev => [res.data, ...prev]);
          setReplyingTo(null);
          refreshMessages();
          
          if (isNearBottom) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
  };

  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
  };

  const handleDelete = (msg) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/messages/${msg._id}`);
              if (res.success) {
                setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isDeleted: true } : m));
                refreshMessages();
              }
            } catch (err) {
              console.error(err);
              alert('Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const handleForward = (msg) => {
    setForwardingMessage(msg);
    setForwardModalVisible(true);
  };

  const handleForwardSelect = async (targetConv) => {
    try {
      const res = await api.post(`/messages/${targetConv._id}`, {
        content: forwardingMessage.content,
        type: 'text',
        forwardedFrom: forwardingMessage._id
      });
      if (res.success) {
        alert('Message forwarded successfully');
        setForwardModalVisible(false);
        setForwardingMessage(null);
        refreshMessages();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to forward message');
    }
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY < 100) {
      setIsNearBottom(true);
      setShowNewMessagesBtn(false);
    } else {
      setIsNearBottom(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!debouncedSearchQuery) return true;
    const q = debouncedSearchQuery.toLowerCase();
    const name = c.displayName?.toLowerCase() || '';
    const emails = c.participants?.map(p => p.email?.toLowerCase() || '').join(' ') || '';
    const dept = c.displayDepartment?.toLowerCase() || '';
    const lastMsg = c.lastMessage?.content?.toLowerCase() || '';
    
    return name.includes(q) || emails.includes(q) || dept.includes(q) || lastMsg.includes(q);
  });

  // Sticky header details
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setActiveConversation(null)} style={styles.backBtn}>
        <FontAwesome name="arrow-left" size={20} color="#1a237e" />
      </TouchableOpacity>
      
      {activeConversation.avatar ? (
        <Image source={{ uri: activeConversation.avatar }} style={styles.headerAvatar} />
      ) : (
        <View style={styles.headerAvatarFallback}>
          <Text style={styles.headerAvatarText}>{activeConversation.initials || 'U'}</Text>
        </View>
      )}

      <View style={styles.headerInfo}>
        <View style={styles.headerNameRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>{activeConversation.displayName}</Text>
          {activeConversation.displayRole && activeConversation.displayRole !== 'admin' && (
            <View style={[styles.headerBadge, activeConversation.displayRole === 'student' ? styles.studentBadge : styles.facultyBadge]}>
              <Text style={activeConversation.displayRole === 'student' ? styles.studentBadgeText : styles.facultyBadgeText}>
                {activeConversation.displayRole}
              </Text>
            </View>
          )}
        </View>
        {activeConversation.displayDepartment ? (
          <Text style={styles.headerSubtitle}>{activeConversation.displayDepartment}</Text>
        ) : null}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyChatContainer}>
      <FontAwesome name="comments-o" size={60} color="#ccc" style={styles.emptyChatIcon} />
      <Text style={styles.emptyChatTitle}>Start the Conversation</Text>
      <Text style={styles.emptyChatSubtitle}>No messages here yet. Send a friendly greeting to begin!</Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map(n => (
        <View key={n} style={[styles.skeletonBubble, n % 2 === 0 ? styles.skeletonOwn : styles.skeletonOther]} />
      ))}
    </View>
  );

  if (activeConversation) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderHeader()}

        {loading && messages.length === 0 ? (
          renderSkeleton()
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={addDateHeaders(messages)}
              keyExtractor={item => item._id}
              inverted
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => {
                if (item.isDateHeader) {
                  return (
                    <View style={styles.dateSeparator}>
                      <Text style={styles.dateSeparatorText}>{item.dateText}</Text>
                    </View>
                  );
                }
                return (
                  <MessageBubble 
                    message={item} 
                    isOwnMessage={item.sender._id === user._id || item.sender === user._id}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onForward={handleForward}
                  />
                );
              }}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={renderEmptyState}
            />

            {/* Scroll to bottom floating button */}
            {showNewMessagesBtn && (
              <TouchableOpacity 
                style={styles.floatingScrollBtn} 
                onPress={() => {
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                  setShowNewMessagesBtn(false);
                }}
              >
                <FontAwesome name="arrow-down" size={14} color="#fff" />
                <Text style={styles.floatingScrollText}>New Messages</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <ChatInput 
          onSend={handleSend} 
          loading={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />

        {/* Forward Conversation Selection Modal */}
        <Modal
          visible={forwardModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setForwardModalVisible(false)}
        >
          <View style={styles.forwardOverlay}>
            <View style={styles.forwardContent}>
              <View style={styles.forwardHeader}>
                <Text style={styles.forwardTitle}>Forward Message To</Text>
                <TouchableOpacity onPress={() => { setForwardModalVisible(false); setForwardingMessage(null); }}>
                  <FontAwesome name="times" size={20} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }}>
                {conversations.filter(c => c._id !== activeConversation._id).map(conv => (
                  <TouchableOpacity 
                    key={conv._id} 
                    style={styles.forwardItem}
                    onPress={() => handleForwardSelect(conv)}
                  >
                    {conv.avatar ? (
                      <Image source={{ uri: conv.avatar }} style={styles.forwardAvatar} />
                    ) : (
                      <View style={styles.forwardAvatarFallback}>
                        <Text style={styles.forwardAvatarText}>{conv.initials || 'U'}</Text>
                      </View>
                    )}
                    <Text style={styles.forwardName}>{conv.displayName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>{showArchived ? 'Archived Chats' : 'Messages'}</Text>
        <TouchableOpacity 
          style={styles.archiveToggleBtn} 
          onPress={() => setShowArchived(!showArchived)}
        >
          <FontAwesome name={showArchived ? "comments" : "archive"} size={18} color="#1a237e" />
          <Text style={styles.archiveToggleText}>
            {showArchived ? 'Active Chats' : 'Archived Chats'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <SearchBar 
        value={userQuery} 
        onChangeText={setUserQuery} 
        placeholder="🔍 Search users to chat..." 
      />

      {userQuery.trim() !== '' && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            <TouchableOpacity onPress={() => { setUserQuery(''); setUserResults([]); }}>
              <FontAwesome name="times-circle" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          {searchingUsers ? (
            <View style={styles.infoBox}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.infoText}>Searching users...</Text>
            </View>
          ) : userResults.length === 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>No results found for "{userQuery}"</Text>
            </View>
          ) : (
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled={true}>
              {userResults.map(item => (
                <TouchableOpacity 
                  key={item.userId} 
                  style={styles.userCard}
                  onPress={() => handleStartChat(item)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.name ? item.name.substring(0, 2).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userHeaderRow}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <View style={[styles.roleBadge, styles[`badge_${item.role}`]]}>
                        <Text style={styles.roleBadgeText}>{item.role}</Text>
                      </View>
                    </View>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.department ? (
                      <Text style={styles.userDetail}>Dept: {item.department}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <SearchBar 
        value={searchQuery} 
        onChangeText={setSearchQuery} 
        placeholder="Search conversations..." 
      />
      
      <ConversationList 
        conversations={filteredConversations}
        onSelect={setActiveConversation}
        loading={false}
        onRefresh={refreshMessages}
        currentUserId={user._id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  topHeader: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  archiveToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  archiveToggleText: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    zIndex: 10
  },
  backBtn: {
    padding: 8,
    marginRight: 8
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    maxWidth: '70%'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#1a237e',
    fontWeight: '500',
    marginTop: 1
  },
  headerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  studentBadge: {
    backgroundColor: '#e8f5e9'
  },
  studentBadgeText: {
    color: '#2e7d32',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  facultyBadge: {
    backgroundColor: '#fff3e0'
  },
  facultyBadgeText: {
    color: '#ef6c00',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  messageList: {
    padding: 16,
    paddingBottom: 24
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 12
  },
  dateSeparatorText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: 'bold'
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 60
  },
  emptyChatIcon: {
    marginBottom: 16,
    opacity: 0.5
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 12
  },
  skeletonBubble: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5'
  },
  skeletonOwn: {
    width: '60%',
    alignSelf: 'flex-end',
    backgroundColor: '#e8eaf6'
  },
  skeletonOther: {
    width: '70%',
    alignSelf: 'flex-start'
  },
  floatingScrollBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    gap: 6
  },
  floatingScrollText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  forwardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  forwardContent: {
    height: '60%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20
  },
  forwardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  forwardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  forwardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  forwardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12
  },
  forwardAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  forwardAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  },
  forwardName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  resultsContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', maxHeight: 250 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f9f9f9' },
  resultsTitle: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  resultsScroll: { maxHeight: 200 },
  infoBox: { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  infoText: { color: '#666', fontSize: 14 },
  userCard: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3f51b5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  userInfo: { flex: 1 },
  userHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 12, color: '#666', marginTop: 1 },
  userDetail: { fontSize: 12, color: '#888', marginTop: 1 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'capitalize' },
  badge_student: { backgroundColor: '#4caf50' },
  badge_faculty: { backgroundColor: '#ff9800' },
  badge_admin: { backgroundColor: '#f44336' }
});
