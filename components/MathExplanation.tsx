import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { solveMathProblem } from '@/utils/mathProcessor';
import MathWebView from '@/components/ui/MathWebView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import StepVisualizer from './StepVisualizer';

interface MathProblemResult {
    originalProblem: string;
    solution: string;
    explanation: string;
    latexExpression: string;
    error: string | null;
}

interface MathExplanationProps {
    mathProblem: MathProblemResult;
    onClose: () => void;
}

const MathExplanation: React.FC<MathExplanationProps> = ({ mathProblem, onClose }) => {
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showStepByStep, setShowStepByStep] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const tintColor = useThemeColor({}, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    const askQuestion = async () => {
        if (!question.trim()) return;

        setIsLoading(true);
        try {
            const context = `
Original Problem: ${mathProblem.originalProblem}
Solution: ${mathProblem.solution}
Explanation: ${mathProblem.explanation}
            `;

            const result = await solveMathProblem(
                `Based on this math problem and solution: ${context}\n\nMy question is: ${question}`,
                // @ts-ignore
                null
            );

            setAnswers(prev => [...prev, `Q: ${question}`, `A: ${result.explanation}`]);
            setQuestion('');

            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Error asking follow-up question:', error);
            setAnswers(prev => [...prev, `Q: ${question}`, `A: Sorry, I couldn't process that question.`]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onClose}
                >
                    <IconSymbol name="chevron.left" size={24} color={textColor} />
                    <Text style={{ color: textColor, marginLeft: 4, fontSize: 16 }}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.headerText, { color: textColor }]}>Math Explanation</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.mathProblemContainer, { backgroundColor: tintColor }]}>
                    <Text style={styles.sectionTitle}>Original Problem</Text>
                    <Text style={styles.mathText}>{mathProblem.originalProblem}</Text>

                    <Text style={styles.sectionTitle}>Solution</Text>
                    <Text style={styles.mathText}>{mathProblem.solution}</Text>

                    {mathProblem.latexExpression && (
                        <>
                            <Text style={styles.sectionTitle}>Mathematical Expression</Text>
                            <MathWebView latexExpression={mathProblem.latexExpression} />
                        </>
                    )}

                    <View style={styles.viewToggleContainer}>
                        <Text style={styles.viewToggleLabel}>
                            {showStepByStep ? "Step-by-Step View" : "Full Explanation"}
                        </Text>
                        <Switch
                            trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.3)' }}
                            thumbColor={showStepByStep ? '#fff' : '#f4f3f4'}
                            ios_backgroundColor="rgba(255,255,255,0.3)"
                            onValueChange={() => setShowStepByStep(!showStepByStep)}
                            value={showStepByStep}
                        />
                    </View>

                    {showStepByStep ? (
                        <StepVisualizer
                            explanation={mathProblem.explanation}
                            latexExpression={mathProblem.latexExpression}
                        />
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Complete Explanation</Text>
                            <Text style={styles.mathText}>{mathProblem.explanation}</Text>
                        </>
                    )}
                </View>

                {answers.length > 0 && (
                    <View style={styles.answersContainer}>
                        <Text style={[styles.followupTitle, { color: textColor }]}>Follow-up Questions</Text>
                        {answers.map((text, index) => (
                            <Text
                                key={index}
                                style={[
                                    styles.answerText,
                                    {
                                        color: text.startsWith('Q:') ? tintColor : textColor,
                                        fontWeight: text.startsWith('Q:') ? 'bold' : 'normal',
                                        marginTop: text.startsWith('Q:') ? 15 : 5
                                    }
                                ]}
                            >
                                {text}
                            </Text>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.textInput, { borderColor: tintColor, color: textColor }]}
                    placeholder="Ask a follow-up question about this problem..."
                    placeholderTextColor="#999"
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: tintColor, opacity: isLoading ? 0.7 : 1 }]}
                    onPress={askQuestion}
                    disabled={isLoading || !question.trim()}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <IconSymbol name="arrow.up" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        marginTop: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    mathProblemContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
        marginBottom: 5,
    },
    mathText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#fff',
    },
    answersContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    followupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    answerText: {
        fontSize: 16,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'flex-end',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingRight: 45,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        position: 'absolute',
        right: 5,
        bottom: 5,
        width: 35,
        height: 35,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 8,
        marginTop: 15,
    },
    viewToggleLabel: {
        color: '#fff',
        fontWeight: 'bold',
    },
    stepByStepButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 8,
        marginTop: 15,
    },
    stepByStepButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default MathExplanation;
