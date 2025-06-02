import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {AppFooter} from "@/components/AppFooter";

export default function LicenseScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const licenses = [
        {
            title: 'MathCalc',
            copyright: '© 2025 Benjamín Alonso Bobadilla Moya',
            license: 'CC BY-SA 4.0',
            url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        {
            title: 'Source Code',
            description: 'GitHub Repository',
            url: 'https://github.com/MathCalc-app/MathCalc',
        },
        {
            title: 'Benjamín Alonso Bobadilla Moya',
            description: 'GitHub Profile',
            url: 'https://github.com/iakzs',
        },
        {
            title: 'Creative Commons',
            description: 'Attribution-ShareAlike 4.0 International',
            url: 'https://creativecommons.org/licenses/by-sa/4.0/legalcode',
        },
        {
            title: 'React Native',
            copyright: '© Meta Platforms, Inc. and affiliates',
            license: 'MIT License',
            url: 'https://github.com/facebook/react-native/blob/main/LICENSE',
        },
        {
            title: 'Expo',
            copyright: '© 2015-present 650 Industries, Inc. (aka Expo)',
            license: 'MIT License',
            url: 'https://github.com/expo/expo/blob/master/LICENSE',
        },
        {
            title: 'React',
            copyright: '© Meta Platforms, Inc. and affiliates',
            license: 'MIT License',
            url: 'https://github.com/facebook/react/blob/main/LICENSE',
        },
        {
            title: 'KaTeX',
            copyright: '© 2013-2020 Khan Academy and other contributors',
            license: 'MIT License',
            url: 'https://github.com/KaTeX/KaTeX/blob/main/LICENSE',
        },
        {
            title: 'Math.js',
            copyright: '© 2013-2023 Jos de Jong',
            license: 'Apache License 2.0',
            url: 'https://github.com/josdejong/mathjs/blob/develop/LICENSE',
        }
    ];

    const handleOpenUrl = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <IconSymbol name="chevron.left" size={24} color={textColor} />
                    <ThemedText>Back</ThemedText>
                </TouchableOpacity>
                <ThemedText type="title">Licenses</ThemedText>
            </View>

            <ScrollView style={styles.scrollView}>
                <ThemedView style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        About MathCalc
                    </ThemedText>
                    <ThemedText style={styles.paragraph}>
                        MathCalc is an educational app designed to help students learn and practice mathematics. The app and its content are made available under the CC BY-SA 4.0 license.
                    </ThemedText>
                </ThemedView>

                {licenses.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.licenseItem}
                        onPress={() => handleOpenUrl(item.url)}
                    >
                        <View>
                            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                            {item.copyright && (
                                <ThemedText style={styles.licenseText}>{item.copyright}</ThemedText>
                            )}
                            {item.license && (
                                <ThemedText style={styles.licenseText}>License: {item.license}</ThemedText>
                            )}
                            {item.description && (
                                <ThemedText style={styles.licenseText}>{item.description}</ThemedText>
                            )}
                            <ThemedText style={[styles.url, { color: tintColor }]}>
                                {item.url}
                            </ThemedText>
                        </View>
                        <IconSymbol name="arrow.up.right" size={20} color={tintColor} />
                    </TouchableOpacity>
                ))}
                <AppFooter/>
            </ScrollView>
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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 8,
    },
    paragraph: {
        lineHeight: 22,
    },
    licenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    licenseText: {
        marginTop: 4,
        opacity: 0.7,
    },
    url: {
        marginTop: 6,
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
