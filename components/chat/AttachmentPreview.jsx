import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AttachmentPreview({ attachments }) {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Attached {attachments.length} file(s)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    margin: 10
  },
  text: {
    fontSize: 14,
    color: '#1a237e'
  }
});
