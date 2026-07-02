import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function RankingTable({ title, data, columns, keyExtractor }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.tableHeader}>
        {columns.map((col, idx) => (
          <Text key={idx} style={[styles.headerText, col.style]}>{col.label}</Text>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View style={[styles.tableRow, index % 2 === 1 && styles.rowAlt]}>
            {columns.map((col, idx) => (
              <Text key={idx} style={[styles.rowText, col.style]} numberOfLines={1}>
                {col.render ? col.render(item) : item[col.key]}
              </Text>
            ))}
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEFF1'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 16,
  },
  empty: {
    color: '#90A4AE',
    textAlign: 'center',
    padding: 20
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    marginBottom: 8
  },
  headerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#546E7A',
    flex: 1
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6
  },
  rowText: {
    fontSize: 14,
    color: '#37474F',
    flex: 1
  }
});
