import 'react-native-reanimated';
import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';
import CustomTabBar from '@/components/CustomTabBar';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
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
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="ellipsis" color={color} />,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="visualization"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="license"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
