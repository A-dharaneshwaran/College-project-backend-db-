import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Toast({ message, type = 'info', visible, onHide }) {

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onHide();
            }, 3000); // 3 seconds visible
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const bgColors = {
        success: '#00A86B', // Fresh Green
        error: '#D32F2F',   // Red
        info: '#0056D2',    // Kathir Blue
    };

    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
    };

    return (
        <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutDown}
            style={[styles.container, { backgroundColor: bgColors[type] }]}
        >
            <View style={styles.iconContainer}>
                <FontAwesome name={icons[type]} size={20} color="#fff" />
            </View>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 1000,
        justifyContent: 'center'
    },
    iconContainer: {
        marginRight: 10,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
