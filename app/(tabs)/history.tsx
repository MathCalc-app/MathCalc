import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getSavedProblems, deleteProblem, MathProblem } from '@/utils/storageUtil';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MathExplanation from '@/components/MathExplanation';
import {router} from "expo-router";

export default function HistoryScreen() {
    const [problems, setProblems] = useState<MathProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProblem, setSelectedProblem] = useState<MathProblem | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const textColor = useThemeColor({}, 'text');
    const navigation = useNavigation();
    const tintColor = useThemeColor({}, 'tint');

    useEffect(() => {
        loadProblems();

        const unsubscribe = navigation.addListener('focus', loadProblems);
        return unsubscribe;
    }, [navigation]);

    const loadProblems = async () => {
        setLoading(true);
        try {
            const savedProblems = await getSavedProblems();
            setProblems(savedProblems);
        } catch (error) {
            console.error('Error loading problems:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProblem = (id: string) => {
        Alert.alert(
            'Delete Problem',
            'Are you sure you want to delete this problem?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProblem(id);
                            setProblems(problems.filter(p => p.id !== id));
                        } catch (error) {
                            console.error('Error deleting problem:', error);
                            Alert.alert('Error', 'Failed to delete problem');
                        }
                    }
                }
            ]
        );
    };

    const handleViewProblem = (problem: MathProblem) => {
        setSelectedProblem(problem);
        setShowExplanation(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderProblemItem = ({ item }: { item: MathProblem }) => (
        <ThemedView style={styles.problemCard}>
            <TouchableOpacity
                style={styles.problemContent}
                onPress={() => handleViewProblem(item)}
            >
                <ThemedText style={styles.problemText}>{item.originalProblem}</ThemedText>
                <ThemedText style={styles.solutionText}>Result: {item.solution}</ThemedText>
                <ThemedText style={styles.dateText}>{formatDate(String(item.timestamp))}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteProblem(item.id)}
            >
                <IconSymbol name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>History</ThemedText>

            {problems.length > 0 ? (
                <FlatList
                    data={problems}
                    renderItem={renderProblemItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={loadProblems}
                />
            ) : (
                <ThemedView style={styles.emptyContainer}>
                    <IconSymbol name="doc.text" size={60} color={tintColor} style={{ opacity: 0.5 }} />
                    <ThemedText style={styles.emptyText}>No history yet</ThemedText>
                    <ThemedText style={styles.emptySubText}>
                        Problems you solve will appear here
                    </ThemedText>

                    <TouchableOpacity
                        style={[styles.solveButton, { backgroundColor: tintColor }]}
                        onPress={() => router.push("/calculator")}
                    >
                        <ThemedText style={styles.solveButtonText}>Solve a Problem</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            )}

            {selectedProblem && showExplanation && (
                <MathExplanation
                    mathProblem={{
                        ...selectedProblem,
                        error: null,
                        latexExpression: selectedProblem.latexExpression || ''
                    }}
                    onClose={() => {
                        setShowExplanation(false);
                        setSelectedProblem(null);
                    }}
                />
            )}
            <ThemedView style={styles.footer}>
                <ThemedText style={[styles.versionText, { color: textColor, opacity: 0.5 }]}>
                    MathCalc v0.0.4
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
        marginBottom: 20,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    problemCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    problemContent: {
        flex: 1,
    },
    problemText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 6,
    },
    solutionText: {
        fontSize: 14,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        opacity: 0.6,
    },
    deleteButton: {
        padding: 8,
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    solveButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        marginTop: 10,
    },
    solveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    versionText: {
        fontSize: 12,
    }
});
