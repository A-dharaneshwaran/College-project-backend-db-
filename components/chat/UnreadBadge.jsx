import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UnreadBadge({ count }) {
  if (!count || count <= 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
