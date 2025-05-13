import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import MathWebView from './ui/MathWebView';
import { useTheme } from '@/contexts/ThemeContext';

type StepVisualizerProps = {
    explanation: string;
    latexExpression?: string;
};

export default function StepVisualizer({ explanation, latexExpression }: StepVisualizerProps) {
    const [steps, setSteps] = useState<string[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const tintColor = useThemeColor({}, 'tint');
    const { effectiveTheme } = useTheme();

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#1c1c1e';

    useEffect(() => {
        if (explanation) {
            let extractedSteps: string[] = [];
            if (explanation.includes('1.') || explanation.includes('Step 1')) {
                const stepPattern = /(?:Step\s*)?(\d+)[\.\)\s]+([^0-9\.\)\r\n]+)/g;
                let match;
                let foundSteps = [];

                while ((match = stepPattern.exec(explanation)) !== null) {
                    foundSteps.push({ index: parseInt(match[1]), content: match[2].trim() });
                }

                if (foundSteps.length > 0) {
                    foundSteps.sort((a, b) => a.index - b.index);
                    extractedSteps = foundSteps.map(step => step.content);
                }
            } else {
                extractedSteps = explanation.split('\n\n').filter(step => step.trim() !== '');
            }

            if (extractedSteps.length === 0) {
                extractedSteps = [explanation];
            }

            setSteps(extractedSteps);
            setCurrentStepIndex(0);
        }
    }, [explanation]);

    const goToNextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const renderStepIndicators = () => {
        return (
            <View style={styles.stepIndicatorsContainer}>
                {steps.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.stepIndicator,
                            index === currentStepIndex && { backgroundColor: tintColor }
                        ]}
                        onPress={() => setCurrentStepIndex(index)}
                    />
                ))}
            </View>
        );
    };

    if (!explanation || steps.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground }]}>
                <IconSymbol name="exclamationmark.triangle" size={24} color={useThemeColor({}, 'text')} />
                <ThemedText style={styles.emptyText}>No explanation available</ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: cardBackground }]}>
            <View style={styles.header}>
                <ThemedText type="subtitle">Step-by-Step Solution</ThemedText>
                <View style={styles.stepCounter}>
                    <ThemedText style={styles.stepCounterText}>
                        Step {currentStepIndex + 1} of {steps.length}
                    </ThemedText>
                </View>
            </View>

            {latexExpression && currentStepIndex === 0 && (
                <View style={styles.latexContainer}>
                    <MathWebView latexExpression={latexExpression} />
                </View>
            )}

            <ScrollView style={styles.stepContent}>
                <ThemedText style={styles.stepText}>{steps[currentStepIndex]}</ThemedText>
            </ScrollView>

            {renderStepIndicators()}

            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[
                        styles.navigationButton,
                        currentStepIndex === 0 && styles.disabledButton
                    ]}
                    onPress={goToPreviousStep}
                    disabled={currentStepIndex === 0}
                >
                    <IconSymbol
                        name="arrow.left"
                        size={20}
                        color={currentStepIndex === 0 ? '#999' : tintColor}
                    />
                    <ThemedText
                        style={[
                            styles.navigationButtonText,
                            currentStepIndex === 0 && styles.disabledButtonText
                        ]}
                    >
                        Previous
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navigationButton,
                        currentStepIndex === steps.length - 1 && styles.disabledButton
                    ]}
                    onPress={goToNextStep}
                    disabled={currentStepIndex === steps.length - 1}
                >
                    <ThemedText
                        style={[
                            styles.navigationButtonText,
                            currentStepIndex === steps.length - 1 && styles.disabledButtonText
                        ]}
                    >
                        Next
                    </ThemedText>
                    <IconSymbol
                        name="arrow.right"
                        size={20}
                        color={currentStepIndex === steps.length - 1 ? '#999' : tintColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    stepCounter: {
        backgroundColor: 'rgba(150,150,150,0.1)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    stepCounterText: {
        fontSize: 12,
    },
    latexContainer: {
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    stepContent: {
        padding: 15,
        maxHeight: 200,
    },
    stepText: {
        lineHeight: 22,
    },
    stepIndicatorsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 15,
    },
    stepIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(150,150,150,0.3)',
        marginHorizontal: 4,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(150,150,150,0.2)',
    },
    navigationButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navigationButtonText: {
        marginHorizontal: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledButtonText: {
        opacity: 0.5,
    },
    emptyContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
    },
    emptyText: {
        marginTop: 10,
        opacity: 0.7,
    }
});
