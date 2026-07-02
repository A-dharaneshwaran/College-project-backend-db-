import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, Pressable, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useMessages } from '../../hooks/useMessages';

// Timestamp Formatter
const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Role Badge Component
const RoleBadge = ({ role }) => {
  if (!role || role === 'admin' || role === 'department' || role === 'institution') return null;
  
  const isStudent = role === 'student';
  return (
    <View style={[styles.badge, isStudent ? styles.studentBadge : styles.facultyBadge]}>
      <Text style={isStudent ? styles.studentBadgeText : styles.facultyBadgeText}>
        {role}
      </Text>
    </View>
  );
};

export default function ConversationList({ 
  conversations, 
  onSelect, 
  loading, 
  onRefresh,
  currentUserId
}) {
  const { pinConversation, archiveConversation } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState(null);

  const renderItem = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const lastMsgText = item.lastMessage?.content || 'No messages yet';
    const isPinned = item.isPinned;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isPinned && styles.pinnedItem]} 
        onPress={() => onSelect(item)}
        onLongPress={() => setSelectedConversation(item)}
        activeOpacity={0.7}
      >
        {/* Left Side: Avatar / Initials */}
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{item.initials || 'U'}</Text>
            </View>
          )}
          {/* Simulated online status indicator placeholder */}
          <View style={[styles.statusDot, item._id.charCodeAt(0) % 2 === 0 ? styles.onlineDot : styles.offlineDot]} />
        </View>

        {/* Middle: Name, Badges, Preview */}
        <View style={styles.contentContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, hasUnread && styles.unreadText]} numberOfLines={1}>
              {item.displayName}
            </Text>
            <RoleBadge role={item.displayRole} />
          </View>
          
          {item.displayDepartment ? (
            <Text style={styles.deptText}>{item.displayDepartment}</Text>
          ) : null}

          <Text style={[styles.messagePreview, hasUnread && styles.unreadText]} numberOfLines={1}>
            {lastMsgText}
          </Text>
        </View>

        {/* Right Side: Time, Badges, Menu */}
        <View style={styles.rightContainer}>
          <Text style={[styles.timeText, hasUnread && styles.unreadTimeText]}>
            {formatTimestamp(item.lastMessageAt)}
          </Text>

          <View style={styles.actionsRow}>
            {isPinned && (
              <FontAwesome name="thumb-tack" size={14} color="#1a237e" style={styles.pinIcon} />
            )}
            
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setSelectedConversation(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="ellipsis-v" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !conversations.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="comments-o" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No conversations found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Conversation Actions Modal */}
      <Modal
        visible={!!selectedConversation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedConversation(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setSelectedConversation(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedConversation?.displayName}
            </Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                pinConversation(selectedConversation._id);
                setSelectedConversation(null);
              }}
            >
              <FontAwesome 
                name={selectedConversation?.isPinned ? "thumb-tack" : "thumb-tack"} 
                size={18} 
                color={selectedConversation?.isPinned ? "#f44336" : "#1a237e"} 
              />
              <Text style={styles.modalOptionText}>
                {selectedConversation?.isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                archiveConversation(selectedConversation._id);
                setSelectedConversation(null);
              }}
            >
              <FontAwesome 
                name="archive" 
                size={18} 
                color="#1a237e" 
              />
              <Text style={styles.modalOptionText}>
                {selectedConversation?.isArchived ? 'Restore Conversation' : 'Archive Conversation'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setSelectedConversation(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif'
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  pinnedItem: {
    backgroundColor: '#f5f6fc',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8eaf6'
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff'
  },
  onlineDot: {
    backgroundColor: '#4caf50'
  },
  offlineDot: {
    backgroundColor: '#9e9e9e'
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    maxWidth: '70%'
  },
  deptText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '500',
    marginBottom: 2
  },
  messagePreview: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#111'
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10
  },
  timeText: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 6
  },
  unreadTimeText: {
    color: '#1a237e',
    fontWeight: 'bold'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  pinIcon: {
    transform: [{ rotate: '45deg' }]
  },
  unreadBadge: {
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  menuButton: {
    padding: 6
  },
  separator: {
    height: 1,
    backgroundColor: '#eceff1'
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  studentBadge: {
    backgroundColor: '#e8f5e9'
  },
  studentBadgeText: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  facultyBadge: {
    backgroundColor: '#fff3e0'
  },
  facultyBadgeText: {
    color: '#ef6c00',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  cancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8
  },
  cancelText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
