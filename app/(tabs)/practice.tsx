import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import PracticeGenerator from '@/components/PracticeGenerator';
import MathWebView from '@/components/ui/MathWebView';
import { sharedStyles } from '@/assets/styles/sharedStyles';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';

const topics = [
    { id: '1', name: 'Algebra', subtopics: ['Equations', 'Inequalities', 'Polynomials'] },
    { id: '2', name: 'Calculus', subtopics: ['Derivatives', 'Integrals', 'Limits'] },
    { id: '3', name: 'Geometry', subtopics: ['Triangles', 'Circles', 'Coordinates'] },
    { id: '4', name: 'Trigonometry', subtopics: ['Identities', 'Functions', 'Equations'] },
    { id: '5', name: 'Statistics', subtopics: ['Probability', 'Distributions', 'Inference'] },
];

export default function PracticeScreen() {
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedSubtopic, setSelectedSubtopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [currentProblem, setCurrentProblem] = useState<{
        question: string;
        solution: string;
        explanation: string;
    } | null>(null);
    const [showSolution, setShowSolution] = useState(false);

    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#1c1c1e';

    const buttonBackground = effectiveTheme === 'light'
        ? '#eaeaea'
        : '#2c2c2e';

    const handleProblemGenerated = (problem: {
        question: string;
        solution: string;
        explanation: string;
    }) => {
        setCurrentProblem(problem);
        setShowSolution(false);
    };

    const resetSelection = () => {
        setSelectedTopic('');
        setSelectedSubtopic('');
        setCurrentProblem(null);
        setShowSolution(false);
    };

    const renderTopicSelection = () => (
        <ThemedView style={[styles.selectionContainer, { backgroundColor: cardBackground }]}>
            <ThemedText type="subtitle">Select a Topic</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
                {topics.map(topic => (
                    <TouchableOpacity
                        key={topic.id}
                        style={[
                            styles.topicButton,
                            { backgroundColor: buttonBackground },
                            selectedTopic === topic.name && { backgroundColor: tintColor }
                        ]}
                        onPress={() => setSelectedTopic(topic.name)}
                    >
                        <ThemedText
                            style={selectedTopic === topic.name ? { color: '#fff', fontWeight: 'bold' } : null}
                        >
                            {topic.name}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </ThemedView>
    );

    const renderSubtopicSelection = () => {
        const currentTopic = topics.find(t => t.name === selectedTopic);
        if (!currentTopic) return null;

        return (
            <ThemedView style={[styles.selectionContainer, { backgroundColor: cardBackground }]}>
                <ThemedText type="subtitle">Select a Subtopic</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
                    {currentTopic.subtopics.map(subtopic => (
                        <TouchableOpacity
                            key={subtopic}
                            style={[
                                styles.topicButton,
                                { backgroundColor: buttonBackground },
                                selectedSubtopic === subtopic && { backgroundColor: tintColor }
                            ]}
                            onPress={() => setSelectedSubtopic(subtopic)}
                        >
                            <ThemedText
                                style={selectedSubtopic === subtopic ? { color: '#fff', fontWeight: 'bold' } : null}
                            >
                                {subtopic}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ThemedView>
        );
    };

    const renderDifficultySelection = () => (
        <ThemedView style={[styles.selectionContainer, { backgroundColor: cardBackground }]}>
            <ThemedText type="subtitle">Select Difficulty</ThemedText>
            <View style={styles.difficultyContainer}>
                {['easy', 'medium', 'hard'].map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={[
                            styles.difficultyButton,
                            { backgroundColor: buttonBackground },
                            difficulty === level && { backgroundColor: tintColor }
                        ]}
                        onPress={() => setDifficulty(level as 'easy' | 'medium' | 'hard')}
                    >
                        <ThemedText
                            style={difficulty === level ? { color: '#fff', fontWeight: 'bold' } : null}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor }}>
            <ScrollView style={sharedStyles.scrollView}>
                <ThemedView style={styles.headerContainer}>
                    <ThemedText type="title" style={sharedStyles.title}>Practice Problems</ThemedText>
                    <ThemedText>
                        Generate custom practice problems tailored to your needs
                    </ThemedText>
                </ThemedView>

                {!selectedTopic ? (
                    renderTopicSelection()
                ) : !selectedSubtopic ? (
                    <>
                        {renderTopicSelection()}
                        {renderSubtopicSelection()}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setSelectedTopic('')}
                        >
                            <ThemedText>← Back to Topics</ThemedText>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <ThemedView style={styles.breadcrumbContainer}>
                            <TouchableOpacity onPress={() => resetSelection()}>
                                <ThemedText style={{ color: tintColor }}>Topics</ThemedText>
                            </TouchableOpacity>
                            <ThemedText> → </ThemedText>
                            <TouchableOpacity onPress={() => setSelectedSubtopic('')}>
                                <ThemedText style={{ color: tintColor }}>{selectedTopic}</ThemedText>
                            </TouchableOpacity>
                            <ThemedText> → {selectedSubtopic}</ThemedText>
                        </ThemedView>

                        {renderDifficultySelection()}

                        <ThemedView style={[styles.practiceContainer, { backgroundColor: cardBackground }]}>
                            <PracticeGenerator
                                topic={`${selectedTopic} ${selectedSubtopic}`}
                                difficulty={difficulty}
                                onProblemGenerated={handleProblemGenerated}
                            />
                        </ThemedView>

                        {currentProblem && (
                            <ThemedView style={[styles.problemContainer, { backgroundColor: cardBackground }]}>
                                <ThemedText type="subtitle">Practice Problem</ThemedText>
                                <MathWebView latexExpression={currentProblem.question || ""} />

                                {!showSolution ? (
                                    <TouchableOpacity
                                        style={[styles.solutionButton, { backgroundColor: tintColor }]}
                                        onPress={() => setShowSolution(true)}
                                    >
                                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                                            Show Solution
                                        </ThemedText>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        <ThemedText type="defaultSemiBold" style={styles.solutionTitle}>
                                            Solution:
                                        </ThemedText>
                                        <MathWebView latexExpression={currentProblem.solution || ""} />

                                        <ThemedText type="defaultSemiBold" style={styles.solutionTitle}>
                                            Explanation:
                                        </ThemedText>
                                        <ThemedText>{currentProblem.explanation || ""}</ThemedText>

                                        <TouchableOpacity
                                            style={[styles.hideSolutionButton,
                                                { borderColor: effectiveTheme === 'dark' ? '#444' : '#ddd' }]}
                                            onPress={() => setShowSolution(false)}
                                        >
                                            <ThemedText>Hide Solution</ThemedText>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </ThemedView>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 16,
        marginBottom: 8,
    },
    selectionContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    topicScroll: {
        marginTop: 8,
    },
    topicButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 8,
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    breadcrumbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    practiceContainer: {
        margin: 16,
        borderRadius: 8,
    },
    problemContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    solutionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    solutionTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    hideSolutionButton: {
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
});
