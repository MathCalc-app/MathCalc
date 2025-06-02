import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from "@/components/ThemedView";
import {AppFooter} from "@/components/AppFooter";

export default function MoreScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const menuItems = [
        {
            title: 'Dashboard',
            icon: 'square.grid.2x2' as const,
            onPress: () => router.push('/(tabs)/dashboard')
        },
        {
            title: 'Visualizer',
            icon: 'function' as const,
            onPress: () => router.push('/(tabs)/visualization')
        },
        {
            title: 'Settings',
            icon: 'gear' as const,
            onPress: () => router.push('/(tabs)/settings')
        },
        {
            title: 'Licenses',
            icon: 'doc.text' as const,
            onPress: () => router.push('/license')
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <View style={styles.header}>
                <ThemedText type="title">More</ThemedText>
            </View>

            <ScrollView style={styles.scrollView}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={item.onPress}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
                            <IconSymbol name={item.icon as any} size={24} color="#FFFFFF" />
                        </View>
                        <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
                        <IconSymbol name="chevron.right" size={20} color={textColor} style={styles.chevron} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <AppFooter/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingTop: 20,
    },
    scrollView: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        minHeight: 70,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        fontSize: 16,
        flex: 1,
    },
    chevron: {
        opacity: 0.5,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 'auto',
        backgroundColor: 'transparent',
    },
    versionText: {
        fontSize: 14,
    }
});
