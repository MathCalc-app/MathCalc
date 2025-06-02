
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MathWebView from '@/components/ui/MathWebView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getOpenAIClient } from '@/utils/mathProcessor';

interface PracticeGeneratorProps {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    onProblemGenerated?: (problem: {
        question: string;
        solution: string;
        explanation: string;
    }) => void;
}

const PracticeGenerator = ({ topic, difficulty, onProblemGenerated }: PracticeGeneratorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [problem, setProblem] = useState<{
        question: string;
        solution: string;
        explanation: string;
    } | null>(null);

    const generateProblem = async () => {
        setIsLoading(true);
        try {
            const openai = await getOpenAIClient();

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert mathematics teacher. Generate a ${difficulty} level math problem on the topic of "${topic}". 
            Provide the problem, step-by-step solution, and a clear explanation.
            Format your response as JSON with these fields: question, solution, explanation.
            The question field should contain a LaTeX representation of the problem.
            Make sure the problem is appropriate for the difficulty level.`
                    },
                    {
                        role: "user",
                        content: `Generate a ${difficulty} math problem about ${topic}.`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                try {
                    const parsedContent = JSON.parse(content);

                    const formattedProblem = {
                        question: parsedContent.question || "x^2 + 2x + 1 = 0",
                        solution: parsedContent.solution || "",
                        explanation: parsedContent.explanation || ""
                    };

                    setProblem(formattedProblem);
                    if (onProblemGenerated) {
                        onProblemGenerated(formattedProblem);
                    }
                } catch (error) {
                    console.error('Error parsing AI response:', error);
                    const defaultProblem = {
                        question: "\\text{Failed to generate problem}",
                        solution: "\\text{No solution available}",
                        explanation: "There was an error generating this problem. Please try again."
                    };
                    setProblem(defaultProblem);
                    if (onProblemGenerated) {
                        onProblemGenerated(defaultProblem);
                    }
                }
            }
        } catch (error) {
            console.error('Error generating problem:', error);
            const fallbackProblem = {
                question: "\\text{Error connecting to AI service}",
                solution: "\\text{No solution available}",
                explanation: "There was an error connecting to the AI service. Please check your API key and internet connection."
            };
            setProblem(fallbackProblem);
            if (onProblemGenerated) {
                onProblemGenerated(fallbackProblem);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="subtitle">{topic} - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</ThemedText>

            {!problem ? (
                <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateProblem}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="sparkles" size={24} color="#fff" />
                            <ThemedText style={styles.buttonText}>Generate Problem</ThemedText>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.problemContainer}>
                    <ThemedText type="defaultSemiBold">Problem:</ThemedText>
                    <MathWebView latexExpression={problem.question || ""} />

                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={generateProblem}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Generate New Problem</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 8,
        marginVertical: 10,
    },
    generateButton: {
        backgroundColor: '#A1CEDC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
    problemContainer: {
        marginTop: 10,
    },
});

export default PracticeGenerator;
