import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import PracticeGenerator from '@/components/PracticeGenerator';
import MathWebView from '@/components/ui/MathWebView';
import { sharedStyles } from '@/assets/styles/sharedStyles';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { incrementStat } from '@/utils/storageUtil';
import MixedLatexText from "@/components/ui/MixedLatexText";
import {AppFooter} from "@/components/AppFooter";

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
    const [mode, setMode] = useState<'practice' | 'quiz'>('practice');
    const [userAnswer, setUserAnswer] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

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
        setUserAnswer('');
        setIsCorrect(null);
    };

    const resetSelection = () => {
        setSelectedTopic('');
        setSelectedSubtopic('');
        setCurrentProblem(null);
        setShowSolution(false);
        setUserAnswer('');
        setIsCorrect(null);
    };

    const toggleMode = () => {
        setMode(mode === 'practice' ? 'quiz' : 'practice');
        setCurrentProblem(null);
        setShowSolution(false);
        setUserAnswer('');
        setIsCorrect(null);

        if (mode === 'quiz') {
            saveQuizResults();
            setQuizScore({ correct: 0, total: 0 });
        }
    };

    const checkAnswer = () => {
        if (!currentProblem || !userAnswer.trim()) return;

        const normalizedUserAnswer = userAnswer.trim().replace(/\s+/g, '');
        const normalizedSolution = typeof currentProblem.solution === 'string'
            ? currentProblem.solution.replace(/\\text\{.*?\}|\\|=/g, '').trim().replace(/\s+/g, '')
            : 'An error occurred. Code: 592';

        const matched = normalizedUserAnswer === normalizedSolution;
        setIsCorrect(matched);

        setQuizScore(prev => ({
            correct: prev.correct + (matched ? 1 : 0),
            total: prev.total + 1
        }));

        setShowSolution(true);

        incrementStat('totalProblemsSolved').catch(console.error);
    };

    const saveQuizResults = async () => {
        try {
            if (quizScore.total === 0) return;

            const quizHistoryString = await AsyncStorage.getItem('quiz_history');
            const quizHistory = quizHistoryString ? JSON.parse(quizHistoryString) : [];

            quizHistory.push({
                date: new Date().toISOString(),
                topic: selectedTopic + (selectedSubtopic ? ` - ${selectedSubtopic}` : ''),
                difficulty,
                score: quizScore.correct,
                total: quizScore.total,
                percentage: Math.round((quizScore.correct / quizScore.total) * 100)
            });

            await AsyncStorage.setItem('quiz_history', JSON.stringify(quizHistory));

            if (quizScore.total > 0) {
                Alert.alert(
                    "Quiz Completed!",
                    `You scored ${quizScore.correct} out of ${quizScore.total} (${Math.round((quizScore.correct / quizScore.total) * 100)}%)`,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('Error saving quiz results:', error);
        }
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

    const renderModeToggle = () => (
        <ThemedView style={[styles.selectionContainer, { backgroundColor: cardBackground }]}>
            <ThemedText type="subtitle">Select Mode</ThemedText>
            <View style={styles.difficultyContainer}>
                <TouchableOpacity
                    style={[
                        styles.difficultyButton,
                        { backgroundColor: buttonBackground },
                        mode === 'practice' && { backgroundColor: tintColor }
                    ]}
                    onPress={() => toggleMode()}
                >
                    <ThemedText
                        style={mode === 'practice' ? { color: '#fff', fontWeight: 'bold' } : null}
                    >
                        Practice
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.difficultyButton,
                        { backgroundColor: buttonBackground },
                        mode === 'quiz' && { backgroundColor: tintColor }
                    ]}
                    onPress={() => toggleMode()}
                >
                    <ThemedText
                        style={mode === 'quiz' ? { color: '#fff', fontWeight: 'bold' } : null}
                    >
                        Quiz
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor }}>
            <ScrollView style={sharedStyles.scrollView}>
                <ThemedView style={styles.headerContainer}>
                    <ThemedText type="title" style={sharedStyles.title}>
                        {mode === 'practice' ? 'Practice Problems' : 'Quiz Mode'}
                    </ThemedText>
                    <ThemedText>
                        {mode === 'practice'
                            ? 'Generate custom practice problems tailored to your needs'
                            : 'Test your knowledge with interactive quizzes'}
                    </ThemedText>
                </ThemedView>

                {renderModeToggle()}

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

                        {mode === 'quiz' && (
                            <ThemedView style={[styles.quizScoreContainer, { backgroundColor: cardBackground }]}>
                                <ThemedText style={styles.quizScoreText}>
                                    Score: {quizScore.correct}/{quizScore.total}
                                    {quizScore.total > 0 && ` (${Math.round((quizScore.correct / quizScore.total) * 100)}%)`}
                                </ThemedText>
                            </ThemedView>
                        )}

                        <ThemedView style={[styles.practiceContainer, { backgroundColor: cardBackground }]}>
                            <PracticeGenerator
                                topic={`${selectedTopic} ${selectedSubtopic}`}
                                difficulty={difficulty}
                                onProblemGenerated={handleProblemGenerated}
                            />
                        </ThemedView>

                        {currentProblem && (
                            <ThemedView style={[styles.problemContainer, { backgroundColor: cardBackground }]}>
                                <ThemedText type="subtitle">
                                    {mode === 'practice' ? 'Practice Problem' : 'Quiz Question'}
                                </ThemedText>
                                <MixedLatexText text={currentProblem.question || ""} />

                                {mode === 'quiz' && !showSolution && (
                                    <View style={styles.quizInputContainer}>
                                        <ThemedText style={styles.yourAnswerLabel}>Your Answer:</ThemedText>
                                        <TextInput
                                            style={[
                                                styles.answerInput,
                                                {
                                                    borderColor: effectiveTheme === 'dark' ? '#444' : '#ddd',
                                                    color: textColor,
                                                    backgroundColor: effectiveTheme === 'dark' ? '#2c2c2e' : '#fff'
                                                }
                                            ]}
                                            value={userAnswer}
                                            onChangeText={setUserAnswer}
                                            placeholder="Type your answer here"
                                            placeholderTextColor={effectiveTheme === 'dark' ? '#aaa' : '#999'}
                                        />
                                        <TouchableOpacity
                                            style={[styles.submitButton, { backgroundColor: tintColor }]}
                                            onPress={checkAnswer}
                                        >
                                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                                                Submit Answer
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {mode === 'practice' && !showSolution ? (
                                    <TouchableOpacity
                                        style={[styles.solutionButton, { backgroundColor: tintColor }]}
                                        onPress={() => setShowSolution(true)}
                                    >
                                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                                            Show Solution
                                        </ThemedText>
                                    </TouchableOpacity>
                                ) : null}

                                {showSolution && (
                                    <>
                                        {mode === 'quiz' && (
                                            <View style={[
                                                styles.resultContainer,
                                                {
                                                    backgroundColor: isCorrect
                                                        ? 'rgba(39, 174, 96, 0.2)'
                                                        : 'rgba(231, 76, 60, 0.2)'
                                                }
                                            ]}>
                                                <IconSymbol
                                                    name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"}
                                                    size={24}
                                                    color={isCorrect ? "#27AE60" : "#E74C3C"}
                                                />
                                                <ThemedText style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                                    {isCorrect ? "Correct!" : "Incorrect"}
                                                </ThemedText>
                                            </View>
                                        )}

                                        <ThemedText type="defaultSemiBold" style={styles.solutionTitle}>
                                            Solution:
                                        </ThemedText>
                                        <MixedLatexText text={currentProblem.solution || ""} />

                                        <ThemedText type="defaultSemiBold" style={styles.solutionTitle}>
                                            Explanation:
                                        </ThemedText>
                                        <MixedLatexText text={currentProblem.explanation || ""} />

                                        <TouchableOpacity
                                            style={[styles.hideSolutionButton,
                                                { borderColor: effectiveTheme === 'dark' ? '#444' : '#ddd' }]}
                                            onPress={() => {
                                                setShowSolution(false);
                                                if (mode === 'quiz') {
                                                    setCurrentProblem(null);
                                                }
                                            }}
                                        >
                                            <ThemedText>
                                                {mode === 'practice' ? 'Hide Solution' : 'Next Question'}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </ThemedView>
                        )}
                    </>
                )}
            </ScrollView>
            <AppFooter/>
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
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    versionText: {
        fontSize: 14,
    },
    quizInputContainer: {
        marginTop: 16,
    },
    yourAnswerLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    answerInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    submitButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    quizScoreContainer: {
        margin: 16,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    quizScoreText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
