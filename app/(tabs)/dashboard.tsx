import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getStats, getSavedProblems, MathProblem, incrementStat } from '@/utils/storageUtil';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {AppFooter} from "@/components/AppFooter";

export default function DashboardScreen() {
    const [stats, setStats] = useState({
        totalProblemsSolved: 0,
        streakDays: 0
    });
    const [recentProblems, setRecentProblems] = useState<MathProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const { effectiveTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    const cardBackground = effectiveTheme === 'light'
        ? '#ffffff'
        : '#252728';

    const cardBorder = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'transparent';

    useFocusEffect(
        useCallback(() => {
            loadData();
            incrementStat('lastActiveDate').catch(console.error);
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const userStats = await getStats();
            setStats({
                totalProblemsSolved: userStats.totalProblemsSolved || 0,
                streakDays: userStats.streakDays || 0
            });

            const problems = await getSavedProblems();
            setRecentProblems(problems.slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const navigateToCalculator = () => {
        router.push("/calculator");
    };

    const navigateToHistory = () => {
        router.push("/history");
    };

    const navigateToHistoryDetail = (id: string) => {
        router.push(`/history?${id}`);
    };

    return (
        <ThemedView style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <>
                        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>

                        <ThemedView style={[
                            styles.statsContainer,
                            {
                                backgroundColor: cardBackground,
                                borderWidth: effectiveTheme === 'light' ? 1 : 0,
                                borderColor: cardBorder,
                            }
                        ]}>
                            <ThemedView style={styles.statCard}>
                                <IconSymbol name="checkmark.circle.fill" size={24} color={tintColor} />
                                <ThemedText style={styles.statValue}>{stats.totalProblemsSolved}</ThemedText>
                                <ThemedText style={styles.statLabel}>Problems Solved</ThemedText>
                            </ThemedView>

                            <ThemedView style={[
                                styles.statDivider,
                                { backgroundColor: effectiveTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }
                            ]} />

                            <ThemedView style={styles.statCard}>
                                <IconSymbol name="flame.fill" size={24} color="#FF9500" />
                                <ThemedText style={styles.statValue}>{stats.streakDays}</ThemedText>
                                <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
                            </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: tintColor }]}
                                onPress={navigateToCalculator}
                            >
                                <IconSymbol name="camera.fill" size={24} color="#fff" />
                                <ThemedText style={styles.actionText}>Scan Problem</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: tintColor }]}
                                onPress={navigateToCalculator}
                            >
                                <IconSymbol name="function" size={24} color="#fff" />
                                <ThemedText style={styles.actionText}>Calculate</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>

                        <ThemedView style={styles.headerRow}>
                            <ThemedText style={styles.sectionTitle}>Recent Problems</ThemedText>
                            <TouchableOpacity onPress={navigateToHistory}>
                                <ThemedText style={[styles.viewAllText, { color: tintColor }]}>View All</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </>
                }
                data={recentProblems}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.problemItem,
                            {
                                backgroundColor: cardBackground,
                                borderWidth: effectiveTheme === 'light' ? 1 : 0,
                                borderColor: cardBorder,
                            }
                        ]}
                        onPress={() => navigateToHistoryDetail(item.id)}
                    >
                        <ThemedText style={styles.problemText} numberOfLines={1}>{item.originalProblem}</ThemedText>
                        <ThemedText style={styles.solutionText} numberOfLines={1}>{item.solution}</ThemedText>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <ThemedView style={[
                        styles.emptyState,
                        {
                            backgroundColor: cardBackground,
                            borderWidth: effectiveTheme === 'light' ? 1 : 0,
                            borderColor: cardBorder,
                        }
                    ]}>
                        <IconSymbol name="doc.text" size={40} color={textColor} style={{ opacity: 0.5 }} />
                        <ThemedText style={styles.emptyText}>No problems solved yet.</ThemedText>
                        <ThemedText style={styles.emptySubText}>Solve your first math problem!</ThemedText>
                    </ThemedView>
                }
                ListFooterComponent={
                    <ThemedView style={[
                        styles.tipsContainer,
                        {
                            backgroundColor: cardBackground,
                            borderWidth: effectiveTheme === 'light' ? 1 : 0,
                            borderColor: cardBorder,
                        }
                    ]}>
                        <ThemedText style={styles.tipTitle}>Pro Tip:</ThemedText>
                        <ThemedText style={styles.tipText}>
                            Take a clear photo of your math problem for the best results.
                        </ThemedText>
                    </ThemedView>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={textColor}
                    />
                }
            />
            <AppFooter/>
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
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 28,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'transparent',
    },
    statDivider: {
        width: 1,
        height: '80%',
        marginHorizontal: 10,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 14,
        opacity: 0.7,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48%',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAllText: {
        fontWeight: 'bold',
    },
    problemItem: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    problemText: {
        fontSize: 16,
        marginBottom: 4,
    },
    solutionText: {
        fontSize: 14,
        opacity: 0.7,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        borderRadius: 12,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 8,
    },
    tipsContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    tipTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 14,
        opacity: 0.8,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    versionText: {
        fontSize: 14,
    }
});
