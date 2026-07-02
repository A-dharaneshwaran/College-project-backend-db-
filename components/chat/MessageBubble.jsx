import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Clipboard, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  onReply, 
  onEdit, 
  onDelete, 
  onForward 
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  const isDeleted = message.isDeleted === true;
  const isEdited = message.isEdited === true;
  const isEditable = isOwnMessage && !isDeleted && (Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000);

  const handleCopy = () => {
    if (message.content && !isDeleted) {
      Clipboard.setString(message.content);
      alert('Message copied to clipboard');
    }
    setMenuVisible(false);
  };

  const handleReplyAction = () => {
    if (onReply) onReply(message);
    setMenuVisible(false);
  };

  const handleEditAction = () => {
    if (onEdit) onEdit(message);
    setMenuVisible(false);
  };

  const handleDeleteAction = () => {
    if (onDelete) onDelete(message);
    setMenuVisible(false);
  };

  const handleForwardAction = () => {
    if (onForward) onForward(message);
    setMenuVisible(false);
  };

  return (
    <View style={styles.bubbleWrapper}>
      <TouchableOpacity
        style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}
        onLongPress={() => !isDeleted && setMenuVisible(true)}
        activeOpacity={0.8}
      >
        {/* Forwarded Header */}
        {(message.forwardedFromDetails || message.forwardedFrom) && (
          <View style={styles.forwardedContainer}>
            <FontAwesome name="share" size={10} color="#757575" />
            <Text style={styles.forwardedText}>Forwarded</Text>
          </View>
        )}

        {/* Sender Name */}
        {!isOwnMessage && message.sender && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}

        {/* Replied Message Preview */}
        {message.replyToDetails && (
          <View style={[styles.replyContainer, isOwnMessage ? styles.ownReply : styles.otherReply]}>
            <Text style={styles.replySender} numberOfLines={1}>
              {message.replyToDetails.senderName}
            </Text>
            <Text style={styles.replyBody} numberOfLines={1}>
              {message.replyToDetails.preview}
            </Text>
          </View>
        )}

        {/* Bubble Body */}
        <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[
            styles.content, 
            isOwnMessage ? styles.ownContent : styles.otherContent,
            isDeleted && styles.deletedContent
          ]}>
            {isDeleted ? 'This message was deleted' : message.content}
          </Text>

          {/* Time & Edit Status */}
          <View style={styles.footerRow}>
            <Text style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isEdited && !isDeleted && (
              <Text style={[styles.edited, isOwnMessage ? styles.ownTime : styles.otherTime]}>
                (edited)
              </Text>
            )}
            
            {/* Show three-dot menu trigger for web hover compatibility */}
            {Platform.OS === 'web' && !isDeleted && (
              <TouchableOpacity 
                style={styles.webMenuTrigger} 
                onPress={() => setMenuVisible(true)}
              >
                <FontAwesome name="angle-down" size={14} color={isOwnMessage ? '#fff' : '#666'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Message Actions Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader} numberOfLines={1}>Message Actions</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleReplyAction}>
              <FontAwesome name="reply" size={16} color="#1a237e" />
              <Text style={styles.modalOptionText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleCopy}>
              <FontAwesome name="copy" size={16} color="#1a237e" />
              <Text style={styles.modalOptionText}>Copy Message</Text>
            </TouchableOpacity>

            {isEditable && (
              <TouchableOpacity style={styles.modalOption} onPress={handleEditAction}>
                <FontAwesome name="edit" size={16} color="#1a237e" />
                <Text style={styles.modalOptionText}>Edit Message</Text>
              </TouchableOpacity>
            )}

            {isOwnMessage && !isDeleted && (
              <TouchableOpacity style={styles.modalOption} onPress={handleDeleteAction}>
                <FontAwesome name="trash" size={16} color="#d32f2f" />
                <Text style={[styles.modalOptionText, { color: '#d32f2f' }]}>Delete Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={handleForwardAction}>
              <FontAwesome name="share" size={16} color="#1a237e" />
              <Text style={styles.modalOptionText}>Forward Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOption, styles.cancelOption]} onPress={() => setMenuVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    width: '100%',
    marginVertical: 4
  },
  container: {
    maxWidth: '80%',
    paddingHorizontal: 10
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  forwardedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 4,
    gap: 4
  },
  forwardedText: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic'
  },
  senderName: {
    fontSize: 12,
    color: '#1a237e',
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: '600'
  },
  replyContainer: {
    padding: 6,
    borderLeftWidth: 3,
    borderRadius: 4,
    marginBottom: -4,
    paddingBottom: 8,
    marginHorizontal: 2
  },
  ownReply: {
    borderLeftColor: '#9fa8da',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  otherReply: {
    borderLeftColor: '#1a237e',
    backgroundColor: '#f5f5f5',
  },
  replySender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 1
  },
  replyBody: {
    fontSize: 11,
    color: '#555'
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1
  },
  ownBubble: {
    backgroundColor: '#1a237e',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#e8ecef'
  },
  content: {
    fontSize: 15,
    lineHeight: 20
  },
  ownContent: {
    color: '#fff',
  },
  otherContent: {
    color: '#333',
  },
  deletedContent: {
    fontStyle: 'italic',
    color: '#9e9e9e',
    opacity: 0.8
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4
  },
  time: {
    fontSize: 10,
  },
  edited: {
    fontSize: 10,
    fontStyle: 'italic'
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: '#9e9e9e',
  },
  webMenuTrigger: {
    marginLeft: 6,
    opacity: 0.6,
    paddingHorizontal: 2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    maxWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8
  },
  modalHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center'
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500'
  },
  cancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 6
  },
  cancelText: {
    color: '#757575',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
