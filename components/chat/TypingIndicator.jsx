import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    paddingHorizontal: 16
  },
  text: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic'
  }
});
