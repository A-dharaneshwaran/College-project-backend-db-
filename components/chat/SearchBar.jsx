import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function SearchBar({ value, onChangeText, placeholder = "Search messages..." }) {
  return (
    <View style={styles.container}>
      <FontAwesome name="search" size={16} color="#999" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 10,
    height: 40
  },
  icon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333'
  }
});
