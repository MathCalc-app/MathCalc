import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { APP_VERSION, APP_COPYRIGHT } from '@/constants/Info';

export function AppFooter() {
    const textColor = useThemeColor({}, 'text');

    return (
        <ThemedView style={styles.footer}>
            <ThemedText style={[styles.text, { color: textColor, opacity: 0.5, textAlign: 'center' }]}>
                {APP_COPYRIGHT}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textColor, opacity: 0.5 }]}>
                {APP_VERSION}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 'auto',
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: 14,
    }
});
