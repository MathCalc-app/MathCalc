import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getSettings, saveSettings, UserSettings, clearAllData } from '@/utils/storageUtil';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        aiResponseLength: 'detailed',
        showLatexByDefault: true,
        notificationsEnabled: true,
    });
    const [loading, setLoading] = useState(true);

    const { theme, setTheme: setAppTheme, effectiveTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#FFFFFF19';

    const borderColor = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(255,255,255,0.1)';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const userSettings = await getSettings();
            setSettings(userSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            await saveSettings(updatedSettings);
            setSettings(updatedSettings);

            if (key === 'theme') {
                await setAppTheme(value as 'light' | 'dark' | 'system');
            }
        } catch (error) {
            console.error(`Error updating ${key}:`, error);
            Alert.alert('Error', 'Failed to update setting');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure you want to clear all your data? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllData();
                            Alert.alert('Success', 'All data has been cleared');
                            loadSettings();
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    }
                }
            ]
        );
    };

    const selectTheme = () => {
        Alert.alert(
            'Select Theme',
            'Choose your preferred app theme',
            [
                {
                    text: 'Light',
                    onPress: () => updateSetting('theme', 'light')
                },
                {
                    text: 'Dark',
                    onPress: () => updateSetting('theme', 'dark')
                },
                {
                    text: 'System Default',
                    onPress: () => updateSetting('theme', 'system')
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const selectResponseLength = () => {
        Alert.alert(
            'AI Response Style',
            'Choose how detailed you want AI explanations to be',
            [
                {
                    text: 'Concise',
                    onPress: () => updateSetting('aiResponseLength', 'concise')
                },
                {
                    text: 'Detailed',
                    onPress: () => updateSetting('aiResponseLength', 'detailed')
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Settings</ThemedText>

            <ThemedView style={[styles.section, { backgroundColor: cardBackground }]}>
                <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>

                <TouchableOpacity
                    style={[styles.settingRow, { borderBottomColor: borderColor }]}
                    onPress={selectTheme}
                >
                    <ThemedView style={styles.settingInfo}>
                        <ThemedText style={styles.settingLabel}>Theme</ThemedText>
                        <ThemedText style={[styles.settingValue, { color: textColor, opacity: 0.6 }]}>
                            {settings.theme === 'light' ? 'Light' :
                                settings.theme === 'dark' ? 'Dark' : 'System Default'}
                        </ThemedText>
                    </ThemedView>
                    <IconSymbol name="chevron.right" size={20} color={tintColor} />
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={[styles.section, { backgroundColor: cardBackground }]}>
                <ThemedText style={styles.sectionTitle}>AI Settings</ThemedText>

                <TouchableOpacity
                    style={[styles.settingRow, { borderBottomColor: borderColor }]}
                    onPress={selectResponseLength}
                >
                    <ThemedView style={styles.settingInfo}>
                        <ThemedText style={styles.settingLabel}>Response Detail</ThemedText>
                        <ThemedText style={[styles.settingValue, { color: textColor, opacity: 0.6 }]}>
                            {settings.aiResponseLength === 'concise' ? 'Concise' : 'Detailed'}
                        </ThemedText>
                    </ThemedView>
                    <IconSymbol name="chevron.right" size={20} color={tintColor} />
                </TouchableOpacity>
            </ThemedView>


                <ThemedView style={[styles.section, { backgroundColor: cardBackground }]}>
                    <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>

                    <ThemedView style={[styles.settingRow, { borderBottomColor: borderColor, backgroundColor: 'transparent' }]}>
                        <ThemedView style={[styles.settingInfo, { backgroundColor: 'transparent' }]}>
                            <ThemedText style={styles.settingLabel}>Enable Notifications</ThemedText>
                        </ThemedView>
                        <Switch
                            value={settings.notificationsEnabled}
                            onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                            trackColor={{ false: effectiveTheme === 'light' ? '#E9E9EA' : '#39393D', true: tintColor }}
                            thumbColor={effectiveTheme === 'light' ? '#FFFFFF' : '#39393D'}
                            ios_backgroundColor={effectiveTheme === 'light' ? '#E9E9EA' : '#39393D'}
                        />
                    </ThemedView>
                </ThemedView>

            <ThemedView style={[styles.section, { backgroundColor: cardBackground }]}>
                <ThemedText style={styles.sectionTitle}>Data</ThemedText>

                <TouchableOpacity
                    style={[styles.settingRow, styles.dangerRow]}
                    onPress={handleClearData}
                >
                    <ThemedView style={styles.settingInfo}>
                        <ThemedText style={[styles.settingLabel, styles.dangerText]}>
                            Clear All Data
                        </ThemedText>
                    </ThemedView>
                    <IconSymbol name="trash" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.footer}>
                <ThemedText style={[styles.versionText, { color: textColor, opacity: 0.5 }]}>
                    MathCalc v0.0.1
                </ThemedText>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        marginBottom: 30,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingInfo: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    settingLabel: {
        backgroundColor: 'transparent',
        fontSize: 16,
    },
    settingValue: {
        fontSize: 14,
        marginTop: 4,
    },
    dangerRow: {
        borderBottomWidth: 0,
    },
    dangerText: {
        color: '#FF3B30',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    versionText: {
        fontSize: 12,
    },
});
