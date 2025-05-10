import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeType;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: ThemeType) => Promise<void>;
}

const defaultContextValue: ThemeContextType = {
    theme: 'system',
    effectiveTheme: 'light',
    setTheme: async () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const useTheme = () => useContext(ThemeContext);

const getSettings = async () => {
    try {
        const data = await AsyncStorage.getItem('settings');
        if (data) {
            return JSON.parse(data);
        }
        return { theme: 'system', aiResponseLength: 'detailed', showLatexByDefault: true, notificationsEnabled: true };
    } catch (error) {
        console.error('Failed to get settings:', error);
        return { theme: 'system', aiResponseLength: 'detailed', showLatexByDefault: true, notificationsEnabled: true };
    }
};

const saveSettings = async (settings: any) => {
    try {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme() || 'light';
    const [theme, setThemeState] = useState<ThemeType>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(systemColorScheme);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const settings = await getSettings();
                setThemeState(settings.theme || 'system');

                if (settings.theme === 'light' || settings.theme === 'dark') {
                    setEffectiveTheme(settings.theme);
                } else {
                    setEffectiveTheme(systemColorScheme);
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to load theme preference:', error);
                setIsInitialized(true);
            }
        };

        loadTheme();
    }, []);

    useEffect(() => {
        if (theme === 'system') {
            setEffectiveTheme(systemColorScheme);
        }

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (theme === 'system' && colorScheme) {
                setEffectiveTheme(colorScheme === 'dark' ? 'dark' : 'light');
            }
        });

        return () => subscription.remove();
    }, [systemColorScheme, theme]);

    const setTheme = async (newTheme: ThemeType) => {
        try {
            setThemeState(newTheme);

            if (newTheme === 'system') {
                setEffectiveTheme(systemColorScheme);
            } else {
                setEffectiveTheme(newTheme);
            }

            const settings = await getSettings();
            await saveSettings({
                ...settings,
                theme: newTheme
            });
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    if (!isInitialized) {
        return null;
    }

    return (
        <ThemeContext.Provider
            value={{
                theme,
                effectiveTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
