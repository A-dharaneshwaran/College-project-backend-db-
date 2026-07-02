import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  info: { icon: 'information-circle', color: '#1565C0' },
  success: { icon: 'checkmark-circle', color: '#2E7D32' },
  warning: { icon: 'warning', color: '#E65100' },
  error: { icon: 'close-circle', color: '#C62828' },
  announcement: { icon: 'megaphone', color: '#6A1B9A' },
  academic: { icon: 'school', color: '#1565C0' },
  discipline: { icon: 'shield', color: '#B71C1C' },
  achievement: { icon: 'trophy', color: '#F57F17' },
  query: { icon: 'chatbubble-ellipses', color: '#00838F' },
  import: { icon: 'cloud-upload', color: '#37474F' },
  export: { icon: 'cloud-download', color: '#37474F' },
  system: { icon: 'settings', color: '#546E7A' },
};

const NotificationCard = React.memo(({ item, onMarkRead, onDelete }) => {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
  const isHighPriority = item.priority === 'high';

  const handlePress = () => {
    if (!item.isRead) onMarkRead(item._id);
    if (item.actionUrl) {
      Linking.openURL(item.actionUrl).catch(() => console.log('Could not open action URL'));
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, !item.isRead && styles.unreadCard]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={24} color={config.color} />
          {isHighPriority && <View style={styles.highPriorityDot} />}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.timeText}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
        </View>
        <View style={styles.actionsContainer}>
          {!item.isRead && (
            <TouchableOpacity onPress={() => onMarkRead(item._id)} style={styles.actionBtn}>
              <Ionicons name="checkmark-done" size={20} color="#1565C0" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color="#C62828" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
      
      {item.actionUrl && (
        <Text style={styles.actionText}>Tap to view details</Text>
      )}
    </TouchableOpacity>
  );
});

export default function NotificationCenter({ accentColor = '#1976D2' }) {
  const { 
    notifications, loading, error, pagination, 
    fetchNotifications, markRead, markAllRead, deleteNotification, clearRead 
  } = useNotification();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchNotifications({ page: 1, limit: 20, read: filter === 'all' ? '' : filter === 'read' }, false);
  }, [filter]); // fetchNotifications is stable via useCallback

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications({ page: 1, limit: 20, read: filter === 'all' ? '' : filter === 'read' }, false);
    setRefreshing(false);
  }, [filter, fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!loading && pagination.hasNext) {
      fetchNotifications({ page: pagination.page + 1, limit: 20, read: filter === 'all' ? '' : filter === 'read' }, true);
    }
  }, [loading, pagination, filter, fetchNotifications]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={accentColor} />
      ) : (
        <>
          <Ionicons name="notifications-off-outline" size={64} color="#B0BEC5" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>You don't have any {filter !== 'all' ? filter : ''} notifications right now.</Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters Bar */}
      <View style={styles.filterBar}>
        {['all', 'unread', 'read'].map(f => (
          <TouchableOpacity 
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
          <Ionicons name="checkmark-done-circle-outline" size={18} color="#546E7A" />
          <Text style={styles.headerBtnText}>Mark All Read</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearRead} style={styles.headerBtn}>
          <Ionicons name="trash-bin-outline" size={18} color="#546E7A" />
          <Text style={styles.headerBtnText}>Clear Read</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <NotificationCard 
            item={item} 
            onMarkRead={markRead} 
            onDelete={deleteNotification} 
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accentColor]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && !refreshing && notifications.length > 0 ? (
            <ActivityIndicator size="small" color={accentColor} style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerBtnText: {
    color: '#546E7A',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: '#F8FBFF',
    borderLeftColor: '#1976D2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  highPriorityDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D32F2F',
    borderWidth: 2,
    borderColor: '#fff',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    color: '#78909C',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: '#546E7A',
    lineHeight: 20,
  },
  actionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
