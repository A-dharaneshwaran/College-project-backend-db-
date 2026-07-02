import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart, LineChart as RNLineChart, PieChart as RNPieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`, // #1976D2 blue
  labelColor: (opacity = 1) => `rgba(84, 110, 122, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  useShadowColorFromDataset: false
};

const getChartData = (data, title) => {
  return {
    labels: data?.labels || ['N/A'],
    datasets: data?.datasets?.map(ds => ({
      data: ds.data || [0],
      color: ds.color ? () => ds.color : undefined
    })) || [{ data: [0] }]
  };
};

const getPieData = (data) => {
  if (!data || !data.labels || !data.datasets || !data.datasets[0]) return [];
  const colors = ['#1976D2', '#C62828', '#2E7D32', '#F57F17', '#6A1B9A', '#00838F'];
  
  return data.labels.map((label, idx) => ({
    name: label,
    population: data.datasets[0].data[idx] || 0,
    color: colors[idx % colors.length],
    legendFontColor: '#546E7A',
    legendFontSize: 12
  }));
};

export const BarChart = ({ data, title, width = screenWidth - 48 }) => {
  if (!data) return <ChartSkeleton title={title} />;
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNBarChart
        data={getChartData(data)}
        width={width}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        style={styles.chartStyle}
        showValuesOnTopOfBars={true}
      />
    </View>
  );
};

export const LineChart = ({ data, title, width = screenWidth - 48 }) => {
  if (!data) return <ChartSkeleton title={title} />;
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNLineChart
        data={getChartData(data)}
        width={width}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        bezier
        style={styles.chartStyle}
      />
    </View>
  );
};

export const PieChart = ({ data, title, width = screenWidth - 48 }) => {
  if (!data) return <ChartSkeleton title={title} />;
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNPieChart
        data={getPieData(data)}
        width={width}
        height={220}
        chartConfig={chartConfig}
        accessor={"population"}
        backgroundColor={"transparent"}
        paddingLeft={"15"}
        absolute
      />
    </View>
  );
};

export const DonutChart = ({ data, title, width = screenWidth - 48 }) => {
  // react-native-chart-kit doesn't have a true donut, but we can fake it or use pie
  return <PieChart data={data} title={title} width={width} />;
};

const ChartSkeleton = ({ title }) => (
  <View style={styles.chartContainer}>
    {title && <Text style={styles.title}>{title}</Text>}
    <View style={[styles.chartStyle, { height: 220, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#B0BEC5' }}>Loading Data...</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  chartContainer: {
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
  chartStyle: {
    borderRadius: 8,
  }
});
