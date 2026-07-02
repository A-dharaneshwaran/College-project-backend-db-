import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotification } from '../context/NotificationContext';
import Animated, { useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';

const NotificationBell = ({ role, color = '#fff' }) => {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount } = useNotification();

  // Setup 30 second polling
  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || (typeof window !== 'undefined' && window.__QA_MODE__)) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const handlePress = () => {
    // Navigate to the role-specific notifications screen
    router.push(`/${role}/notifications`);
  };

  // Simple animation for the badge when count changes
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: unreadCount > 0 ? withSpring(1) : withSpring(0) }
      ]
    };
  });

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={24} color={color} />
      
      {unreadCount > 0 && (
        <Animated.View style={[styles.badge, animatedStyle]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#1976D2', // Adjust based on header color to pop
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default React.memo(NotificationBell);
