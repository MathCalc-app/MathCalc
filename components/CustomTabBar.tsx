import React, { useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    Text
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation
}) => {
    const { bottom } = useSafeAreaInsets();
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const tabWidth = (width - 40) / Math.min(5, state.routes.length);

    useEffect(() => {
        const activeIndex = state.index;
        if (activeIndex < 5) {
        }
    }, [state.index, tabWidth]);


    const getIconName = (routeName: string) => {
        switch (routeName) {
            case 'index': return 'house.fill';
            case 'calculator': return 'plus.forwardslash.minus';
            case 'practice': return 'books.vertical';
            case 'history': return 'clock';
            case 'more': return 'ellipsis';
            default: return 'questionmark.circle';
        }
    };

    const visibleRoutes = state.routes.slice(0, 5);

    return (
        <View style={[
            styles.container,
            { paddingBottom: bottom > 0 ? 0 : 0 }
        ]}>
            <BlurView
                intensity={effectiveTheme === 'dark' ? 85 : 90}
                tint={effectiveTheme as 'dark' | 'light'}
                style={styles.blurView}
            >
                <View style={[
                    styles.tabBarContainer,
                    {
                        backgroundColor: effectiveTheme === 'dark'
                            ? 'rgba(30, 30, 30, 0.5)'
                            : 'rgba(255, 255, 255, 0.5)'
                    }
                ]}>

                    {visibleRoutes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name.charAt(0).toUpperCase() + route.name.slice(1);

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }

                        };

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                onPress={onPress}
                                style={styles.tabButton}
                            >
                                {options.tabBarIcon ? 
                                    options.tabBarIcon({ 
                                        focused: isFocused, 
                                        color: isFocused ? tintColor : textColor,
                                        size: 24 
                                    }) : 
                                    <IconSymbol 
                                        size={24} 
                                        name={getIconName(route.name)} 
                                        color={isFocused ? tintColor : textColor} 
                                    />
                                }
                                {isFocused && (
                                    <Text style={[styles.tabLabel, { color: tintColor }]}>
                                        {typeof label === 'string' ? label : route.name}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? (Platform.isPad ? 20 : 34) : 20,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 999,
    },
    blurView: {
        borderRadius: 30,
        overflow: 'hidden',
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    tabBarContainer: {
        flexDirection: 'row',
        borderRadius: 30,
        height: 60,
        position: 'relative',
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: 'rgba(150, 150, 150, 0.2)',
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 48,
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
});

export default CustomTabBar;
