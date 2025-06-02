import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, TouchableOpacity, Alert, TextInput, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getSettings, saveSettings, UserSettings, clearAllData } from '@/utils/storageUtil';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppFooter } from "@/components/AppFooter";

export default function SettingsScreen() {
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        aiResponseLength: 'detailed',
        showLatexByDefault: true,
        notificationsEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [wolframApiKey, setWolframApiKey] = useState('');
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showWolframKey, setShowWolframKey] = useState(false);

    const { theme, setTheme: setAppTheme, effectiveTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const inputBackground = effectiveTheme === 'light' ? '#FFFFFF' : '#2C2C2E';

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#FFFFFF19';

    const borderColor = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(255,255,255,0.1)';

    useEffect(() => {
        loadSettings();
        loadApiKeys();
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

    const loadApiKeys = async () => {
        try {
            const oaiKey = await AsyncStorage.getItem('openai_api_key');
            if (oaiKey) {
                setOpenaiApiKey(oaiKey);
            }

            const waKey = await AsyncStorage.getItem('wolfram_alpha_api_key');
            if (waKey) {
                setWolframApiKey(waKey);
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    };

    const saveOpenAIApiKey = async () => {
        try {
            await AsyncStorage.setItem('openai_api_key', openaiApiKey);
            Alert.alert('Success', 'OpenAI API key saved successfully');
        } catch (error) {
            console.error('Error saving OpenAI API key:', error);
            Alert.alert('Error', 'Failed to save OpenAI API key');
        }
    };

    const saveWolframApiKey = async () => {
        try {
            await AsyncStorage.setItem('wolfram_alpha_api_key', wolframApiKey);
            Alert.alert('Success', 'Wolfram Alpha API key saved successfully');
        } catch (error) {
            console.error('Error saving Wolfram Alpha API key:', error);
            Alert.alert('Error', 'Failed to save Wolfram Alpha API key');
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
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
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

                    <View style={[styles.settingRow, { borderBottomColor: borderColor, paddingVertical: 16 }]}>
                        <View style={styles.apiKeyContainer}>
                            <ThemedText style={styles.settingLabel}>Wolfram Alpha API Key</ThemedText>
                            <ThemedText style={[styles.settingValue, { color: textColor, opacity: 0.6, marginBottom: 8 }]}>
                                Primary API for solving math problems from images
                            </ThemedText>
                            <View style={styles.apiKeyInputContainer}>
                                <TextInput
                                    style={[
                                        styles.apiKeyInput,
                                        {
                                            backgroundColor: inputBackground,
                                            color: textColor,
                                            borderColor: borderColor
                                        }
                                    ]}
                                    placeholder="Enter Wolfram Alpha API Key"
                                    placeholderTextColor={effectiveTheme === 'light' ? '#999' : '#777'}
                                    value={wolframApiKey}
                                    onChangeText={setWolframApiKey}
                                    secureTextEntry={!showWolframKey}
                                />
                                <TouchableOpacity
                                    style={styles.toggleButton}
                                    onPress={() => setShowWolframKey(!showWolframKey)}
                                >
                                    <IconSymbol
                                        name={showWolframKey ? "eye.slash" : "eye"}
                                        size={20}
                                        color={tintColor}
                                    />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: tintColor }]}
                                onPress={saveWolframApiKey}
                            >
                                <ThemedText style={styles.saveButtonText}>Save Wolfram Alpha API Key</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: borderColor, paddingVertical: 16 }]}>
                        <View style={styles.apiKeyContainer}>
                            <ThemedText style={styles.settingLabel}>OpenAI API Key</ThemedText>
                            <ThemedText style={[styles.settingValue, { color: textColor, opacity: 0.6, marginBottom: 8 }]}>
                                Required for image recognition and fallback solver
                            </ThemedText>
                            <View style={styles.apiKeyInputContainer}>
                                <TextInput
                                    style={[
                                        styles.apiKeyInput,
                                        {
                                            backgroundColor: inputBackground,
                                            color: textColor,
                                            borderColor: borderColor
                                        }
                                    ]}
                                    placeholder="Enter OpenAI API Key"
                                    placeholderTextColor={effectiveTheme === 'light' ? '#999' : '#777'}
                                    value={openaiApiKey}
                                    onChangeText={setOpenaiApiKey}
                                    secureTextEntry={!showOpenAIKey}
                                />
                                <TouchableOpacity
                                    style={styles.toggleButton}
                                    onPress={() => setShowOpenAIKey(!showOpenAIKey)}
                                >
                                    <IconSymbol
                                        name={showOpenAIKey ? "eye.slash" : "eye"}
                                        size={20}
                                        color={tintColor}
                                    />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: tintColor }]}
                                onPress={saveOpenAIApiKey}
                            >
                                <ThemedText style={styles.saveButtonText}>Save OpenAI API Key</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
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
                <AppFooter/>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
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
        fontSize: 14,
    },
    apiKeyContainer: {
        width: '100%',
    },
    apiKeyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    apiKeyInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    toggleButton: {
        position: 'absolute',
        right: 12,
        height: 44,
        justifyContent: 'center',
    },
    saveButton: {
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
