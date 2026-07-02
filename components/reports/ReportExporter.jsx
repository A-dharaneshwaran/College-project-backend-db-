import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function ReportExporter({ onExport, loading }) {
  const [reportType, setReportType] = useState('students');
  const [format, setFormat] = useState('CSV');
  const [dateRange, setDateRange] = useState('all'); // could be extended with date pickers

  const handleExport = () => {
    // Pass standard filters up to the hook
    let filters = {};
    if (dateRange === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      filters.dateFrom = d.toISOString();
    }
    
    onExport(reportType, format, filters);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Center</Text>
      <Text style={styles.subtitle}>Generate and download institutional data exports.</Text>

      <View style={styles.formRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Report Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={reportType}
              onValueChange={setReportType}
              style={styles.picker}
            >
              <Picker.Item label="Student Data" value="students" />
              <Picker.Item label="Faculty Data" value="faculty" />
              <Picker.Item label="Attendance Logs" value="attendance" />
              <Picker.Item label="Marks & Performance" value="performance" />
              <Picker.Item label="Discipline Reports" value="discipline" />
              <Picker.Item label="Activity Logs" value="activity" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Format</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={format}
              onValueChange={setFormat}
              style={styles.picker}
            >
              <Picker.Item label="CSV (Spreadsheet)" value="CSV" />
              <Picker.Item label="XLSX (Excel)" value="XLSX" />
              <Picker.Item label="PDF Document" value="PDF" />
            </Picker>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.exportBtn, loading && styles.exportBtnDisabled]} 
        onPress={handleExport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportBtnText}>Generate & Download</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263238',
  },
  subtitle: {
    fontSize: 14,
    color: '#78909C',
    marginBottom: 20,
    marginTop: 4
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  inputGroup: {
    flex: 1,
    minWidth: 200
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#546E7A',
    marginBottom: 8
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden'
  },
  picker: {
    height: 40,
    borderWidth: 0,
    backgroundColor: 'transparent'
  },
  exportBtn: {
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  exportBtnDisabled: {
    backgroundColor: '#90CAF9'
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
