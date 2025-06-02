import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface Stats {
    totalProblemsSolved: number;
    streakDays: number;
    lastActiveDate?: string;
    [key: string]: any;
}

export interface MathProblem {
    id: string;
    originalProblem: string;
    solution: string;
    explanation: string;
    latexExpression?: string;
    timestamp: number | string;
}

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    aiResponseLength: 'concise' | 'detailed';
    showLatexByDefault: boolean;
    notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
    theme: 'system',
    aiResponseLength: 'detailed',
    showLatexByDefault: true,
    notificationsEnabled: true,
};

const KEYS = {
    SAVED_PROBLEMS: 'savedProblems',
    SETTINGS: 'userSettings',
    STATS: 'userStats',
};

export const saveProblem = async (problem: Omit<MathProblem, 'id' | 'timestamp'>): Promise<MathProblem> => {
    try {
        const existingProblemsJson = await AsyncStorage.getItem(KEYS.SAVED_PROBLEMS);
        const existingProblems: MathProblem[] = existingProblemsJson ? JSON.parse(existingProblemsJson) : [];

        const newProblem: MathProblem = {
            ...problem,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
        };

        const updatedProblems = [newProblem, ...existingProblems];
        await AsyncStorage.setItem(KEYS.SAVED_PROBLEMS, JSON.stringify(updatedProblems));

        await incrementStat('totalProblemsSolved');

        return newProblem;
    } catch (error) {
        console.error('Error saving problem:', error);
        throw error;
    }
};

export const getSavedProblems = async (): Promise<MathProblem[]> => {
    try {
        const savedProblemsJson = await AsyncStorage.getItem(KEYS.SAVED_PROBLEMS);
        return savedProblemsJson ? JSON.parse(savedProblemsJson) : [];
    } catch (error) {
        console.error('Error retrieving saved problems:', error);
        return [];
    }
};

export const deleteProblem = async (id: string): Promise<boolean> => {
    try {
        const savedProblemsJson = await AsyncStorage.getItem(KEYS.SAVED_PROBLEMS);
        const savedProblems: MathProblem[] = savedProblemsJson ? JSON.parse(savedProblemsJson) : [];

        const updatedProblems = savedProblems.filter(problem => problem.id !== id);
        await AsyncStorage.setItem(KEYS.SAVED_PROBLEMS, JSON.stringify(updatedProblems));

        return true;
    } catch (error) {
        console.error('Error deleting problem:', error);
        return false;
    }
};

export const saveSettings = async (settings: UserSettings): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
};

export const getSettings = async (): Promise<UserSettings> => {
    try {
        const settingsJson = await AsyncStorage.getItem(KEYS.SETTINGS);
        return settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error retrieving settings:', error);
        return DEFAULT_SETTINGS;
    }
};

interface UserStats {
    totalProblemsSolved: number;
    lastActiveDate: string;
    mostRecentCategories: string[];
    streakDays: number;
}

const DEFAULT_STATS: UserStats = {
    totalProblemsSolved: 0,
    lastActiveDate: new Date().toISOString(),
    mostRecentCategories: [],
    streakDays: 0,
};

export async function getStats(): Promise<Stats> {
    try {
        const statsString = await AsyncStorage.getItem('stats');
        if (statsString) {
            return JSON.parse(statsString);
        }
        return {
            totalProblemsSolved: 0,
            streakDays: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            totalProblemsSolved: 0,
            streakDays: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
        };
    }
}

export async function incrementStreak(): Promise<number> {
    try {
        const stats = await getStats();
        const today = new Date().toISOString().split('T')[0];
        const lastActive = stats.lastActiveDate || '';

        if (!stats.streakDays) {
            stats.streakDays = 1;
        }
        else if (lastActive === today) {
        }
        else if (isConsecutiveDay(lastActive, today)) {
            stats.streakDays += 1;
        }
        else {
            stats.streakDays = 1;
        }

        stats.lastActiveDate = today;
        await AsyncStorage.setItem('stats', JSON.stringify(stats));
        return stats.streakDays;
    } catch (error) {
        console.error('Error incrementing streak:', error);
        return 0;
    }
}

function isConsecutiveDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(12, 0, 0, 0);
    d2.setHours(12, 0, 0, 0);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 1;
}

export async function incrementStat(stat: keyof Stats): Promise<void> {
    try {
        const stats = await getStats();

        if (stat === 'lastActiveDate') {
            stats.lastActiveDate = new Date().toISOString().split('T')[0];
        } else if (typeof stats[stat] === 'number') {
            (stats[stat] as number) += 1;
        }

        await AsyncStorage.setItem('stats', JSON.stringify(stats));
    } catch (error) {
        console.error(`Error incrementing ${String(stat)}:`, error);
    }
}

export async function clearAllData(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const appKeys = keys.filter(key =>
            key.startsWith('math_') ||
            key === 'problems' ||
            key === 'stats' ||
            key === 'settings' ||
            key === 'savedProblems');

        await AsyncStorage.multiRemove(appKeys);

        const defaultStats = {
            totalProblemsSolved: 0,
            streakDays: 0,
            lastActiveDate: new Date().toISOString().split('T')[0]
        };
        await AsyncStorage.setItem('stats', JSON.stringify(defaultStats));

        const settings = await getSettings();
        await saveSettings(settings);

        console.log('All data cleared successfully');
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
}
