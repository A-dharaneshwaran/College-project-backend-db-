import React from 'react';
import { View, StyleSheet } from 'react-native';
import ContactDirectory from '../../components/chat/ContactDirectory';

export default function FacultyContactScreen() {
  return (
    <View style={styles.container}>
      <ContactDirectory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }
});
