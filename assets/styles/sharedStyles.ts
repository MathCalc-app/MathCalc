import { StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export const getThemeColors = () => {
    return {
        background: useThemeColor({}, 'background'),
        text: useThemeColor({}, 'text'),
        tint: useThemeColor({}, 'tint'),
        card: useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'cardBackground'),
        inputBackground: { light: '#ffffff', dark: '#252728' },
        inputBorder: { light: 'rgba(0,0,0,0.1)', dark: 'rgba(255,255,255,0.1)' },
        buttonBackground: { light: '#f0f0f0', dark: '#2c2c2e' },
    };
};

export const sharedStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        marginBottom: 30,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    card: {
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
});
