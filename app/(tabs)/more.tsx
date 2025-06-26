import React, { useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from "@/components/ThemedView";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { AppFooter } from '@/components/AppFooter';
import * as Clipboard from 'expo-clipboard';

export default function MoreScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const cardBackground = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const { effectiveTheme } = useTheme();
    
    const cardTextColor = effectiveTheme === 'dark' 
      ? cardBackground === '#000000' || cardBackground.startsWith('#0') || cardBackground.startsWith('#1') || cardBackground.startsWith('#2')
        ? '#FFFFFF' 
        : '#000000'
      : cardBackground === '#FFFFFF' || cardBackground.startsWith('#F') || cardBackground.startsWith('#E') || cardBackground.startsWith('#D')
        ? '#000000'
        : '#FFFFFF';
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const menuItems = [
        {
            title: 'Dashboard',
            icon: 'chart.bar.fill',
            color: '#4A90E2',
            description: 'View your stats and progress',
            onPress: () => router.push('/(tabs)/dashboard')
        },
        {
            title: 'Visualizer',
            icon: 'function',
            color: '#50C878',
            description: 'Explore mathematical functions',
            onPress: () => router.push('/(tabs)/visualization')
        },
        {
            title: 'Licenses',
            icon: 'doc.text.fill',
            color: '#F08080',
            description: 'View third-party licenses',
            onPress: () => router.push('/license')
        },
        {
            title: 'Share App',
            icon: 'square.and.arrow.up',
            color: '#FF8C00',
            description: 'Share with friends',
            onPress: () => copyToClipboard('Check out MathCalc! https://mathcalc.app')
        },
    ];

    const { width } = Dimensions.get('window');
    const cardWidth = width < 600 ? (width - 48) / 2 : (width - 64) / 3;
    const isTablet = width >= 600;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>More Options</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Customize and explore additional features</ThemedText>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[
                    styles.gridContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    {menuItems.map((item, index) => {
                        const delay = index * 100;
                        const itemFade = useRef(new Animated.Value(0)).current;
                        
                        useEffect(() => {
                            Animated.timing(itemFade, {
                                toValue: 1,
                                duration: 500,
                                delay: delay,
                                useNativeDriver: true,
                            }).start();
                        }, []);

                        return (
                            <Animated.View 
                                key={index} 
                                style={{ 
                                    opacity: itemFade,
                                    transform: [{ 
                                        translateY: itemFade.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0]
                                        }) 
                                    }],
                                    width: cardWidth
                                }}
                            >
                                <TouchableOpacity
                                    style={[styles.menuCard, { 
                                        backgroundColor: cardBackground,
                                        borderWidth: effectiveTheme === 'dark' ? 1 : 0,
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.title}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                                        <IconSymbol name={item.icon} size={28} color="#FFFFFF" />
                                    </View>
                                    <ThemedText type="defaultSemiBold" style={[styles.menuItemTitle, { color: cardTextColor }]}>
                                        {item.title}
                                    </ThemedText>
                                    <ThemedText style={[styles.menuItemDescription, { color: cardTextColor, opacity: 0.7 }]}>
                                        {item.description}
                                    </ThemedText>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </Animated.View>
                
                <View style={styles.profileSection}>
                    <LinearGradient
                        colors={
                            effectiveTheme === 'dark' 
                                ? ['#ffffffff', '#6e6363ff'] 
                                : ['#181818ff', '#4a3535ff']
                        }
                        style={styles.profileCard}
                    >
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            onPress={() => router.push('/settings')}
                            accessibilityRole="button"
                            accessibilityLabel="Your Account"
                        >
                            <View style={styles.profileContent}>
                                <View style={[styles.profileIconContainer, { backgroundColor: tintColor }]}>
                                    <IconSymbol name="person.fill" size={24} color="#FFFFFF" />
                                </View>
                                <View style={styles.profileTextContainer}>
                                    <ThemedText type="defaultSemiBold" style={[styles.profileTitle, { color: cardTextColor }]}>
                                        Your Account
                                    </ThemedText>
                                    <ThemedText style={[styles.profileSubtitle, { color: cardTextColor, opacity: 0.7 }]}>
                                        Manage your profile and preferences
                                    </ThemedText>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color={cardTextColor} style={styles.chevron} />
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
                <AppFooter />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    menuCard: {
        borderRadius: 16,
        padding: 16,
        margin: 8,
        minHeight: 160,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    menuItemTitle: {
        fontSize: 16,
        marginBottom: 6,
    },
    menuItemDescription: {
        fontSize: 12,
    },
    profileSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    profileCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    profileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileTextContainer: {
        flex: 1,
    },
    profileTitle: {
        fontSize: 16,
    },
    profileSubtitle: {
        fontSize: 13,
    },
    chevron: {
        opacity: 0.5,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    versionText: {
        fontSize: 12,
        opacity: 0.5,
    }
});

function copyToClipboard(text: string) {
    Clipboard.setStringAsync(text);
    if (typeof window !== 'undefined' && window.alert) {
        window.alert('Share App\n\nLink copied to clipboard! You can now share it with your friends.');
    } else {
        // @ts-ignore
        alert('Share App\n\nLink copied to clipboard! You can now share it with your friends.', 'Share App');
    }
}

