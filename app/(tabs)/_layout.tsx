import 'react-native-reanimated';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 80 : 60,
                    zIndex: 8,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2" color={color} />,
                }}
            />
            <Tabs.Screen
                name="calculator"
                options={{
                    title: 'Calculator',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.forwardslash.minus" color={color} />,
                }}
            />
            <Tabs.Screen
                name="visualization"
                options={{
                    title: 'Visualize',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="function" color={color} />,
                }}
            />
            <Tabs.Screen
                name="practice"
                options={{
                    title: 'Practice',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="books.vertical" color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
                }}
            />
        </Tabs>
    );
}
