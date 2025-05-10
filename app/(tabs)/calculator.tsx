import React, {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View, Modal} from 'react-native';
import type {CameraView as CameraViewType} from 'expo-camera';
import {Camera, CameraType, CameraView} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as math from 'mathjs';
import {ThemedText} from '@/components/ThemedText';
import {ThemedView} from '@/components/ThemedView';
import {IconSymbol} from '@/components/ui/IconSymbol';
import {useThemeColor} from '@/hooks/useThemeColor';
import { solveMathProblemFromImage } from '@/utils/mathProcessor';
import MathWebView from '@/components/ui/MathWebView';
import MathExplanation from "@/components/MathExplanation";
import {saveProblem, incrementStreak, getStats} from '@/utils/storageUtil';
import { StreakAnimation } from '@/components/StreakAnimation';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

export default function CalculatorScreen() {
    const [latexExpression, setLatexExpression] = useState<string>('');
    const [showMathView, setShowMathView] = useState<boolean>(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [currentMathProblem, setCurrentMathProblem] = useState<any>(null);
    const [showStreakAnimation, setShowStreakAnimation] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);

    const cameraRef = useRef<CameraViewType>(null);

    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const inputBackground = effectiveTheme === 'light'
        ? '#ffffff'
        : '#252728';

    const inputBorder = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'transparent';

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleProblemSolved = async () => {
        try {
            const currentStreakCount = await getStats().then(stats => stats.streakDays || 0);
            const newStreakCount = await incrementStreak();
            setCurrentStreak(newStreakCount);
            if (newStreakCount > currentStreakCount) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowStreakAnimation(true);
            }
        } catch (error) {
            console.error('Error handling streak:', error);
        }
    };

    const handleCalculate = async () => {
        try {
            if (!expression.trim()) {
                setResult('Enter an expression');
                return;
            }

            const cleanedExpression = expression
                .replace(/x/g, '*')
                .replace(/÷/g, '/')
                .replace(/[^\d+\-*/().]/g, '');

            const calculatedResult = math.evaluate(cleanedExpression);
            setResult(calculatedResult.toString());

            const problem = {
                originalProblem: expression,
                solution: calculatedResult.toString(),
                explanation: `The expression ${expression} evaluates to ${calculatedResult}`,
                latexExpression: ''
            };

            setCurrentMathProblem(problem);

            await saveProblem(problem);
            await handleProblemSolved();

        } catch (error) {
            setResult('Error: Invalid expression');
            console.error('Calculation error:', error);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo && photo.uri) {
                    processImage(photo.uri);
                } else {
                    Alert.alert('Error', 'Failed to capture image');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to take picture');
                console.error(error);
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setIsLoading(true);
        try {
            setExpression('Processing image...');
            setResult('');
            setShowMathView(false);
            setCurrentMathProblem(null);

            console.log('Calling solveMathProblemFromImage with URI:', uri);
            const result = await solveMathProblemFromImage(uri);
            console.log('Result received:', result);

            if (result.error) {
                console.error('Error in result:', result.error);
                setExpression('Error: ' + result.error);
                setResult('');
            } else {
                setExpression(result.originalProblem);
                setResult(String(result.solution));
                setCurrentMathProblem(result);

                if (result.originalProblem && result.solution) {
                    await saveProblem({
                        originalProblem: result.originalProblem,
                        solution: result.solution,
                        explanation: result.explanation || '',
                        latexExpression: result.latexExpression || ''
                    });

                    await handleProblemSolved();
                }

                if (result.latexExpression && result.latexExpression.length > 0) {
                    setLatexExpression(result.latexExpression);
                    setShowMathView(true);
                } else {
                    setLatexExpression('');
                    setShowMathView(false);
                }

                if (result.explanation && result.explanation.length > 0) {
                    console.log('Explanation:', result.explanation);
                    setTimeout(() => {
                        Alert.alert(
                            'Solution',
                            result.explanation.length > 200
                                ? result.explanation.substring(0, 200) + '...'
                                : result.explanation,
                            [
                                {
                                    text: 'See Full Explanation',
                                    onPress: () => setShowExplanation(true)
                                },
                                { text: 'OK' }
                            ]
                        );
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Unhandled error in processImage:', error);
            Alert.alert('Processing Error', 'Failed to process the image');
            setExpression('Error processing image');
            setResult('');
        } finally {
            setIsLoading(false);
            setIsCameraActive(false);
        }
    };

    const toggleCamera = () => {
        setIsCameraActive(!isCameraActive);
    };

    if (hasPermission === null) {
        return <ThemedView style={styles.container}><ThemedText>Requesting camera permission...</ThemedText></ThemedView>;
    }

    if (!hasPermission) {
        return <ThemedView style={styles.container}><ThemedText>No access to camera</ThemedText></ThemedView>;
    }

    return (
        <ThemedView style={styles.container}>
            {showStreakAnimation && (
                <StreakAnimation
                    streakCount={currentStreak}
                    onAnimationComplete={() => setShowStreakAnimation(false)}
                />
            )}

            {isCameraActive ? (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        type={cameraType}
                    >
                        <View style={styles.cameraControls}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setCameraType(
                                    cameraType === 'back' ? 'front' : 'back'
                                )}
                            >
                                <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                <View style={styles.captureInner} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={toggleCamera}>
                                <IconSymbol name="xmark" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                </View>
            ) : (
                <View style={styles.calculatorContainer}>
                    <ThemedText type="title" style={styles.title}>Calculator</ThemedText>

                    <View style={[
                        styles.expressionContainer,
                        {
                            backgroundColor: inputBackground,
                            borderWidth: effectiveTheme === 'light' ? 1 : 0,
                            borderColor: inputBorder
                        }
                    ]}>
                        <ThemedText style={styles.expressionText}>{expression}</ThemedText>
                    </View>

                    <View style={[styles.resultContainer, { backgroundColor: tintColor }]}>
                        <Text style={[styles.resultText, { color: '#fff' }]}>{result}</Text>

                        {currentMathProblem && (
                            <TouchableOpacity
                                style={styles.explainButton}
                                onPress={() => setShowExplanation(true)}
                            >
                                <Text style={styles.explainButtonText}>Full Explanation & AI Help</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {showMathView && latexExpression && (
                        <MathWebView latexExpression={latexExpression} />
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: tintColor }]}
                            onPress={handleCalculate}
                        >
                            <Text style={styles.actionButtonText}>Calculate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: tintColor }]}
                            onPress={() => setExpression('')}
                        >
                            <Text style={styles.actionButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cameraButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.cameraButton, { backgroundColor: tintColor }]}
                            onPress={toggleCamera}
                        >
                            <Text style={styles.cameraButtonText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.cameraButton, { backgroundColor: tintColor }]}
                            onPress={pickImage}
                        >
                            <Text style={styles.cameraButtonText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal
                visible={showExplanation}
                animationType="slide"
                onRequestClose={() => setShowExplanation(false)}
            >
                {currentMathProblem && (
                    <MathExplanation
                        mathProblem={currentMathProblem}
                        onClose={() => setShowExplanation(false)}
                    />
                )}
            </Modal>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Processing image...</Text>
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 20,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    calculatorContainer: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        marginBottom: 30,
        textAlign: 'center',
    },
    expressionContainer: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        minHeight: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    expressionText: {
        fontSize: 24,
    },
    resultContainer: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
        minHeight: 60,
    },
    resultText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    explainButton: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 5,
        alignSelf: 'flex-end',
    },
    explainButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    cameraButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '48%',
    },
    cameraButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
