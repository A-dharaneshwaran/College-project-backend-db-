import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ title, value, icon, color = '#1976D2', trend, trendValue }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      
      {trend && (
        <View style={styles.trendWrapper}>
          <Ionicons 
            name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'} 
            size={14} 
            color={trend === 'up' ? '#2E7D32' : trend === 'down' ? '#C62828' : '#757575'} 
          />
          <Text style={[
            styles.trendText,
            { color: trend === 'up' ? '#2E7D32' : trend === 'down' ? '#C62828' : '#757575' }
          ]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flex: 1,
    minWidth: '45%',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEFF1'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263238',
  },
  trendWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600'
  }
});
