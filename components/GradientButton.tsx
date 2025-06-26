import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    Platform,
    ColorValue
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
    disabled?: boolean;
    loading?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary' | 'tertiary';
}

const GradientButton = ({
    title,
    onPress,
    style,
    textStyle,
    gradientColors,
    disabled = false,
    loading = false,
    startIcon,
    endIcon,
    size = 'medium',
    variant = 'primary'
}: GradientButtonProps) => {
    const { effectiveTheme } = useTheme();
    const buttonStartColor = useThemeColor({}, 'buttonGradientStart');
    const buttonEndColor = useThemeColor({}, 'buttonGradientEnd');
    const accentColor = useThemeColor({}, 'accent');
    const tertiaryColor = useThemeColor({}, 'tertiary');

    const primaryColors = [buttonStartColor, buttonEndColor] as readonly [ColorValue, ColorValue];
    const secondaryColorsLight = ['#4B69E7', '#3B59D7'] as readonly [ColorValue, ColorValue];
    const secondaryColorsDark = ['#6E8BFF', '#4B69E7'] as readonly [ColorValue, ColorValue];
    const tertiaryColorsLight = ['#16A085', '#138D75'] as readonly [ColorValue, ColorValue];
    const tertiaryColorsDark = ['#1ABC9C', '#16A085'] as readonly [ColorValue, ColorValue];

    let colors = gradientColors || primaryColors;

    if (!gradientColors) {
        switch (variant) {
            case 'primary':
                colors = primaryColors;
                break;
            case 'secondary':
                colors = effectiveTheme === 'dark' ? secondaryColorsDark : secondaryColorsLight;
                break;
            case 'tertiary':
                colors = effectiveTheme === 'dark' ? tertiaryColorsDark : tertiaryColorsLight;
                break;
        }
    }

    const buttonSizeStyle = (() => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                };
            case 'large':
                return {
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                };
            default: // medium
                return {
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                };
        }
    })();

    const textSizeStyle = (() => {
        switch (size) {
            case 'small':
                return { fontSize: 14 };
            case 'large':
                return { fontSize: 18 };
            default:
                return { fontSize: 16 };
        }
    })();

    const opacityStyle = {
        opacity: disabled ? 0.6 : 1,
    };

    const shadowStyle = Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    } : {
        elevation: 3,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.buttonContainer, shadowStyle, opacityStyle, style]}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, buttonSizeStyle]}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        {startIcon && <>{startIcon}</>}
                        <Text style={[
                            styles.text,
                            textSizeStyle,
                            startIcon || endIcon ? styles.textWithIcon : null,
                            textStyle
                        ]}>
                            {title}
                        </Text>
                        {endIcon && <>{endIcon}</>}
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    gradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontWeight: '600',
        textAlign: 'center',
    },
    textWithIcon: {
        marginHorizontal: 8,
    }
});

export default GradientButton;
