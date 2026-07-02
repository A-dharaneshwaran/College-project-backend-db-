import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function ChatInput({ 
  onSend, 
  loading, 
  replyingTo, 
  onCancelReply, 
  editingMessage, 
  onCancelEdit 
}) {
  const [text, setText] = useState('');

  // Populate text on edit
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (text.trim() && !loading) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Reply Preview Bar */}
      {replyingTo && (
        <View style={styles.actionPreviewBar}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <FontAwesome name="reply" size={12} color="#1a237e" />
              <Text style={styles.previewTitle} numberOfLines={1}>
                Replying to {replyingTo.sender?.name || 'User'}
              </Text>
            </View>
            <Text style={styles.previewBody} numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.closeButton}>
            <FontAwesome name="times-circle" size={18} color="#757575" />
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Preview Bar */}
      {editingMessage && (
        <View style={styles.actionPreviewBar}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <FontAwesome name="edit" size={12} color="#1a237e" />
              <Text style={styles.previewTitle} numberOfLines={1}>
                Editing Message
              </Text>
            </View>
            <Text style={styles.previewBody} numberOfLines={1}>
              {editingMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelEdit} style={styles.closeButton}>
            <FontAwesome name="times-circle" size={18} color="#757575" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Input Controls */}
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, (!text.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name={editingMessage ? "check" : "send"} size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  actionPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f6fc',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
    justifyContent: 'space-between'
  },
  previewContent: {
    flex: 1,
    marginRight: 10
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a237e'
  },
  previewBody: {
    fontSize: 13,
    color: '#616161'
  },
  closeButton: {
    padding: 4
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#1a237e',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  sendButtonDisabled: {
    backgroundColor: '#9fa8da'
  }
});
