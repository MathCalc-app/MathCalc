import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface StreakAnimationProps {
    streakCount: number;
    onAnimationComplete?: () => void;
}

export function StreakAnimation({ streakCount, onAnimationComplete }: StreakAnimationProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const tintColor = useThemeColor({}, 'tint');

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.delay(1000),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onAnimationComplete) {
                onAnimationComplete();
            }
        });
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.animationContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0]
                        })
                    }
                ]}
            >
                <View style={[styles.streakBadge, { backgroundColor: tintColor }]}>
                    <IconSymbol name="flame.fill" size={32} color="#fff" />
                    <Text style={styles.streakText}>{streakCount}</Text>
                    <Text style={styles.streakLabel}>
                        {streakCount === 1 ? 'Day Streak Started!' : 'Day Streak!'}
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakBadge: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    streakText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 5,
    },
    streakLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 5,
    },
});
