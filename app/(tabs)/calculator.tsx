import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    TextInput,
    FlatList,
    PanResponder,
    GestureResponderEvent,
    Animated,
    Keyboard, ScrollView
} from 'react-native';
import type {CameraView as CameraViewType} from 'expo-camera';
import {Camera, CameraType, CameraView} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as math from 'mathjs';
import {ThemedText} from '@/components/ThemedText';
import {ThemedView} from '@/components/ThemedView';
import {IconSymbol} from '@/components/ui/IconSymbol';
import {useThemeColor} from '@/hooks/useThemeColor';
import {solveMathProblemFromImage} from '@/utils/mathProcessor';
import MathWebView from '@/components/ui/MathWebView';
import MathExplanation from "@/components/MathExplanation";
import {saveProblem, incrementStreak, getStats} from '@/utils/storageUtil';
import {StreakAnimation} from '@/components/StreakAnimation';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@/contexts/ThemeContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {scheduleNotification, notifySolutionComplete, schedulePracticeReminder} from '@/utils/notificationUtil';
import {sharedStyles} from '@/assets/styles/sharedStyles';
import AdvancedCalculator from '@/components/AdvancedCalculator';

const unitConversions = {
    length: {
        m: { cm: 100, km: 0.001, inch: 39.3701, ft: 3.28084, mi: 0.000621371 },
        cm: { m: 0.01, km: 0.00001, inch: 0.393701, ft: 0.0328084, mi: 0.00000621371 },
        km: { m: 1000, cm: 100000, inch: 39370.1, ft: 3280.84, mi: 0.621371 },
        inch: { m: 0.0254, cm: 2.54, km: 0.0000254, ft: 0.0833333, mi: 0.0000157828 },
        ft: { m: 0.3048, cm: 30.48, km: 0.0003048, inch: 12, mi: 0.000189394 },
        mi: { m: 1609.34, cm: 160934, km: 1.60934, inch: 63360, ft: 5280 }
    },
    mass: {
        kg: { g: 1000, lb: 2.20462, oz: 35.274 },
        g: { kg: 0.001, lb: 0.00220462, oz: 0.035274 },
        lb: { kg: 0.453592, g: 453.592, oz: 16 },
        oz: { kg: 0.0283495, g: 28.3495, lb: 0.0625 }
    },
    temperature: {
        C: { F: (c: number) => (c * 9/5) + 32, K: (c: number) => c + 273.15 },
        F: { C: (f: number) => (f - 32) * 5/9, K: (f: number) => (f - 32) * 5/9 + 273.15 },
        K: { C: (k: number) => k - 273.15, F: (k: number) => (k - 273.15) * 9/5 + 32 }
    }
};

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
    const [showKeypad, setShowKeypad] = useState(false);
    const [showUnitConverter, setShowUnitConverter] = useState(false);
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [unitValue, setUnitValue] = useState('');
    type UnitType = 'length' | 'mass' | 'temperature';
    const [unitType, setUnitType] = useState<UnitType>('length');
    const [useScientificNotation, setUseScientificNotation] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<string[]>([]);

    const cameraRef = useRef<CameraViewType>(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const swipeAnim = useRef(new Animated.Value(0)).current;
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

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) =>
                Math.abs(gestureState.dx) > 20,
            onPanResponderGrant: () => {
                swipeAnim.setValue(0);
            },
            onPanResponderMove: (evt, gestureState) => {
                swipeAnim.setValue(gestureState.dx);
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx > 120 && currentStepIndex > 0) {
                    Animated.timing(swipeAnim, {
                        toValue: 300,
                        duration: 250,
                        useNativeDriver: true
                    }).start(() => {
                        setCurrentStepIndex(currentStepIndex - 1);
                        swipeAnim.setValue(0);
                    });
                } else if (gestureState.dx < -120 && currentStepIndex < steps.length - 1) {
                    Animated.timing(swipeAnim, {
                        toValue: -300,
                        duration: 250,
                        useNativeDriver: true
                    }).start(() => {
                        setCurrentStepIndex(currentStepIndex + 1);
                        swipeAnim.setValue(0);
                    });
                } else {
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                }
            }
        })
    ).current;

    const handleAdvancedCalculation = (originalProblem: string, solution: string, explanation: string) => {
        const problem = {
            originalProblem,
            solution,
            explanation,
            latexExpression: ''
        };

        setExpression(originalProblem);
        setResult(solution);
        setCurrentMathProblem(problem);

        const stepsArray = explanation.split('\n').filter(step => step.trim().length > 0);
        setSteps(stepsArray);
        setCurrentStepIndex(0);

        saveProblem(problem);
        handleProblemSolved();
        notifySolutionComplete(originalProblem);
        schedulePracticeReminder(1);
    };

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

    const formatScientific = (num: number): string => {
        if (!useScientificNotation) return num.toString();

        if (num === 0) return '0';

        const exp = Math.floor(Math.log10(Math.abs(num)));
        const mantissa = num / Math.pow(10, exp);

        return mantissa.toFixed(4) + ' × 10^' + exp;
    };

    const handleCalculate = async () => {
        try {
            if (!expression.trim()) {
                setResult('Enter an expression');
                return;
            }

            let processedExpression = expression;
            const openParenCount = (expression.match(/\(/g) || []).length;
            const closeParenCount = (expression.match(/\)/g) || []).length;

            if (openParenCount > closeParenCount) {
                processedExpression += ')'.repeat(openParenCount - closeParenCount);
            }

            const cleanedExpression = processedExpression
                .replace(/x/g, '*')
                .replace(/÷/g, '/')
                .replace(/[^\d+\-*/().e]/g, '');

            const calculatedResult = math.evaluate(cleanedExpression);
            const formattedResult = useScientificNotation ?
                formatScientific(calculatedResult) : calculatedResult.toString();

            setResult(formattedResult);

            const steps = [];
            steps.push(`Start with the expression: ${expression}`);

            if (openParenCount !== closeParenCount) {
                steps.push(`Balance parentheses: ${processedExpression}`);
            }

            if (cleanedExpression.includes('(') && cleanedExpression.includes(')')) {
                steps.push(`Evaluate expressions inside parentheses first`);
            }
            if (cleanedExpression.includes('*') || cleanedExpression.includes('/')) {
                steps.push(`Perform multiplication and division operations`);
            }
            if (cleanedExpression.includes('+') || cleanedExpression.includes('-')) {
                steps.push(`Perform addition and subtraction operations`);
            }

            steps.push(`Final result: ${formattedResult}`);
            setSteps(steps);
            setCurrentStepIndex(0);

            const problem = {
                originalProblem: expression,
                solution: formattedResult,
                explanation: steps.join('\n'),
                latexExpression: ''
            };

            setCurrentMathProblem(problem);

            await saveProblem(problem);
            await handleProblemSolved();
            await notifySolutionComplete(expression);
            await schedulePracticeReminder(1);
        } catch (error) {
            setResult('Error: Invalid expression');
            console.error('Calculation error:', error);
        }
    };

    const convertUnit = () => {
        if (!unitValue || !fromUnit || !toUnit || !unitType) {
            Alert.alert('Error', 'Please fill all fields for conversion');
            return;
        }

        try {
            const value = parseFloat(unitValue);
            let result;

            if (unitType === 'temperature') {
                const isTemperature = (type: string): type is 'temperature' => type === 'temperature';

                if (isTemperature(unitType)) {
                    const tempConversions = unitConversions[unitType];
                    if (fromUnit in tempConversions && toUnit in tempConversions[fromUnit as keyof typeof tempConversions]) {
                        const convertFunc = tempConversions[fromUnit as keyof typeof tempConversions][toUnit as keyof typeof tempConversions[keyof typeof tempConversions]] as (val: number) => number;
                        result = convertFunc(value);
                    } else {
                        throw new Error('Invalid temperature conversion units');
                    }
                } else {
                    const conversionFactor = unitConversions[unitType][fromUnit][toUnit];
                    result = value * conversionFactor;
                }
            } else {
                if (unitType in unitConversions &&
                    fromUnit in unitConversions[unitType as keyof typeof unitConversions] &&
                    toUnit in unitConversions[unitType as keyof typeof unitConversions][fromUnit as keyof typeof unitConversions[keyof typeof unitConversions]]) {
                    const conversionFactor = unitConversions[unitType as keyof typeof unitConversions][fromUnit as keyof typeof unitConversions[keyof typeof unitConversions]][toUnit as keyof typeof unitConversions[keyof typeof unitConversions][keyof typeof unitConversions[keyof typeof unitConversions]]];
                    result = value * Number(conversionFactor);
                } else {
                    throw new Error('Invalid conversion units');
                }
            }

            const formattedResult = useScientificNotation ?
                formatScientific(result) : result.toString();

            setExpression(`${unitValue} ${fromUnit} = ${formattedResult} ${toUnit}`);
            setResult(formattedResult);
            setShowUnitConverter(false);
        } catch (error) {
            Alert.alert('Conversion Error', 'Unable to convert between these units');
        }
    };

    const handleKeypadInput = (value: string) => {
        if (value === 'C') {
            setExpression('');
        } else if (value === '⌫') {
            setExpression(prev => prev.slice(0, -1));
        } else if (value === '=') {
            handleCalculate();
            Keyboard.dismiss();
        } else {
            setExpression(prev => prev + value);
        }
    };

    const renderKeypad = () => {
        const keys = [
            ['7', '8', '9', '÷'],
            ['4', '5', '6', 'x'],
            ['1', '2', '3', '-'],
            ['0', '.', '(', '+'],
            [')', 'C', '⌫', '=']
        ];

        return (
            <View style={styles.keypadContainer}>
                {keys.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                        {row.map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.keypadButton,
                                    {
                                        backgroundColor:
                                            key === '=' ? tintColor :
                                                ['C', '⌫', '÷', 'x', '-', '+', '(', ')'].includes(key) ?
                                                    'rgba(0,0,0,0.1)' : inputBackground
                                    }
                                ]}
                                onPress={() => handleKeypadInput(key)}
                            >
                                <Text style={[
                                    styles.keypadButtonText,
                                    {
                                        color: key === '=' ? '#fff' : textColor,
                                        fontWeight: ['=', 'C', '⌫', '÷', 'x', '-', '+', '(', ')'].includes(key) ? 'bold' : 'normal'
                                    }
                                ]}>
                                    {key}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        );
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

                if (result.explanation) {
                    const stepsArray = result.explanation
                        .split('\n')
                        .filter(step => step.trim().length > 0);
                    setSteps(stepsArray);
                    setCurrentStepIndex(0);
                }

                if (result.originalProblem && result.solution) {
                    await saveProblem({
                        originalProblem: result.originalProblem,
                        solution: result.solution,
                        explanation: result.explanation || '',
                        latexExpression: result.latexExpression || ''
                    });

                    await handleProblemSolved();
                    await notifySolutionComplete(result.originalProblem);
                    await schedulePracticeReminder(1);
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

    const renderUnitConverter = () => {
        type UnitType = 'length' | 'mass' | 'temperature';

        const unitOptions: Record<UnitType, string[]> = {
            length: ['m', 'cm', 'km', 'inch', 'ft', 'mi'],
            mass: ['kg', 'g', 'lb', 'oz'],
            temperature: ['C', 'F', 'K']
        };

        return (
            <Modal
                visible={showUnitConverter}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowUnitConverter(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.converterContainer, {backgroundColor}]}>
                        <View style={styles.converterHeader}>
                            <Text style={[styles.converterTitle, {color: textColor}]}>Unit Converter</Text>
                            <TouchableOpacity
                                style={[styles.closeButton, {backgroundColor: tintColor}]}
                                onPress={() => setShowUnitConverter(false)}
                            >
                                <IconSymbol name="xmark" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.unitTypeContainer}>
                            {['length', 'mass', 'temperature'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.unitTypeButton,
                                        {backgroundColor: unitType === type ? tintColor : 'rgba(0,0,0,0.1)'}
                                    ]}
                                    onPress={() => {
                                        setUnitType(type as UnitType);
                                        setFromUnit('');
                                        setToUnit('');
                                    }}
                                >
                                    <Text style={{
                                        color: unitType === type ? '#fff' : textColor,
                                        fontWeight: 'bold',
                                        textTransform: 'capitalize'
                                    }}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.converterInput, {borderColor: inputBorder, color: textColor, backgroundColor: inputBackground}]}
                            placeholder="Enter value"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={unitValue}
                            onChangeText={setUnitValue}
                        />

                        <View style={styles.unitSelectionContainer}>
                            <View style={styles.unitColumn}>
                                <Text style={[styles.unitLabel, {color: textColor}]}>From:</Text>
                                <View style={styles.unitButtonContainer}>
                                    {unitOptions[unitType].map(unit => (
                                        <TouchableOpacity
                                            key={`from-${unit}`}
                                            style={[
                                                styles.unitButton,
                                                {
                                                    backgroundColor: fromUnit === unit ? tintColor : 'rgba(0,0,0,0.1)',
                                                }
                                            ]}
                                            onPress={() => setFromUnit(unit)}
                                        >
                                            <Text style={{
                                                color: fromUnit === unit ? '#fff' : textColor,
                                                fontWeight: fromUnit === unit ? 'bold' : 'normal'
                                            }}>
                                                {unit}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.unitColumn}>
                                <Text style={[styles.unitLabel, {color: textColor}]}>To:</Text>
                                <View style={styles.unitButtonContainer}>
                                    {unitOptions[unitType].map((unit: string) => (
                                        <TouchableOpacity
                                            key={`to-${unit}`}
                                            style={[
                                                styles.unitButton,
                                                {
                                                    backgroundColor: toUnit === unit ? tintColor : 'rgba(0,0,0,0.1)',
                                                }
                                            ]}
                                            onPress={() => setToUnit(unit)}
                                        >
                                            <Text style={{
                                                color: toUnit === unit ? '#fff' : textColor,
                                                fontWeight: toUnit === unit ? 'bold' : 'normal'
                                            }}>
                                                {unit}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.convertButton, {backgroundColor: tintColor}]}
                            onPress={convertUnit}
                        >
                            <Text style={[styles.convertButtonText]}>Convert</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderStepVisualizer = () => {
        if (!steps || steps.length === 0) return null;

        return (
            <View
                style={styles.stepVisualizerContainer}
                {...panResponder.panHandlers}
            >
                <Animated.View
                    style={[
                        styles.stepCard,
                        {
                            transform: [{ translateX: swipeAnim }],
                            backgroundColor: tintColor
                        }
                    ]}
                >
                    <Text style={[styles.stepText, { color: '#fff' }]}>
                        {steps[currentStepIndex]}
                    </Text>

                    <View style={styles.stepNavigator}>
                        <TouchableOpacity
                            style={[
                                styles.stepNavButton,
                                { opacity: currentStepIndex > 0 ? 1 : 0.5 }
                            ]}
                            onPress={() => {
                                if (currentStepIndex > 0) {
                                    setCurrentStepIndex(currentStepIndex - 1);
                                }
                            }}
                            disabled={currentStepIndex === 0}
                        >
                            <IconSymbol name="chevron.left" size={16} color="#fff" />
                            <Text style={styles.stepNavText}>Previous</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepCounter}>
                            {currentStepIndex + 1} / {steps.length}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.stepNavButton,
                                { opacity: currentStepIndex < steps.length - 1 ? 1 : 0.5 }
                            ]}
                            onPress={() => {
                                if (currentStepIndex < steps.length - 1) {
                                    setCurrentStepIndex(currentStepIndex + 1);
                                }
                            }}
                            disabled={currentStepIndex === steps.length - 1}
                        >
                            <Text style={styles.stepNavText}>Next</Text>
                            <IconSymbol name="chevron.right" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Text style={[styles.swipeHint, { color: textColor, opacity: 0.7 }]}>
                    Swipe left/right to navigate between steps
                </Text>
            </View>
        );
    };

    if (hasPermission === null) {
        return <ThemedView style={sharedStyles.container}><ThemedText>Requesting camera permission...</ThemedText></ThemedView>;
    }

    if (!hasPermission) {
        return <ThemedView style={sharedStyles.container}><ThemedText>No access to camera</ThemedText></ThemedView>;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
            <ScrollView style={sharedStyles.scrollView}>
                <ThemedView style={sharedStyles.container}>
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
                                //@ts-ignore
                                type={cameraType}
                            >
                                <View style={styles.cameraControls}>
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
                            <ThemedText type="title" style={sharedStyles.title}>Calculator</ThemedText>

                            <View style={[
                                styles.expressionContainer,
                                {
                                    backgroundColor: inputBackground,
                                    borderWidth: effectiveTheme === 'light' ? 1 : 0,
                                    borderColor: inputBorder
                                }
                            ]}>
                                <ThemedText style={styles.expressionText}>{expression}</ThemedText>
                                <TouchableOpacity
                                    style={styles.keypadToggle}
                                    onPress={() => setShowKeypad(!showKeypad)}
                                >
                                    <IconSymbol
                                        name={showKeypad ? "keyboard.chevron.compact.down" : "keyboard"}
                                        size={20}
                                        color={textColor}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.resultContainer, { backgroundColor: tintColor }]}>
                                <Text style={[styles.resultText, { color: '#fff' }]}>{result}</Text>

                                <View style={styles.resultActionContainer}>
                                    {currentMathProblem && (
                                        <TouchableOpacity
                                            style={styles.explainButton}
                                            onPress={() => setShowExplanation(true)}
                                        >
                                            <Text style={styles.explainButtonText}>Full Explanation & AI Help</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.scientificToggle}
                                        onPress={() => setUseScientificNotation(!useScientificNotation)}
                                    >
                                        <Text style={[styles.scientificToggleText, { color: '#fff' }]}>
                                            {useScientificNotation ? 'Standard' : 'Scientific'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {steps.length > 0 && renderStepVisualizer()}

                            {showMathView && latexExpression && (
                                <MathWebView latexExpression={latexExpression} />
                            )}

                            {showKeypad ? (
                                renderKeypad()
                            ) : (
                                <>
                                    <View style={sharedStyles.buttonRow}>
                                        <TouchableOpacity
                                            style={[sharedStyles.actionButton, { backgroundColor: tintColor }]}
                                            onPress={handleCalculate}
                                        >
                                            <Text style={sharedStyles.actionButtonText}>Calculate</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[sharedStyles.actionButton, { backgroundColor: tintColor }]}
                                            onPress={() => setExpression('')}
                                        >
                                            <Text style={sharedStyles.actionButtonText}>Clear</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.toolsContainer}>

                                        <TouchableOpacity
                                            style={[styles.toolButton, { backgroundColor: tintColor }]}
                                            onPress={toggleCamera}
                                        >
                                            <IconSymbol name="camera" size={24} color="#fff" />
                                            <Text style={styles.toolButtonText}>Camera</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.toolButton, { backgroundColor: tintColor }]}
                                            onPress={pickImage}
                                        >
                                            <IconSymbol name="photo.on.rectangle" size={24} color="#fff" />
                                            <Text style={styles.toolButtonText}>Gallery</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.toolButton, { backgroundColor: tintColor }]}
                                            onPress={() => setShowUnitConverter(true)}
                                        >
                                            <IconSymbol name="arrow.left.arrow.right" size={24} color="#fff" />
                                            <Text style={styles.toolButtonText}>Convert</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.toolButton, { backgroundColor: tintColor }]}
                                            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                        >
                                            <IconSymbol name="square.stack.3d.up" size={24} color="#fff" />
                                            <Text style={styles.toolButtonText}>Advanced</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}
                </ThemedView>

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

                <Modal
                    visible={showAdvancedOptions}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowAdvancedOptions(false)}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor }}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                                <ThemedText type="subtitle">Advanced Calculator</ThemedText>
                                <TouchableOpacity
                                    style={[styles.closeButton, { backgroundColor: tintColor }]}
                                    onPress={() => setShowAdvancedOptions(false)}
                                >
                                    <IconSymbol name="xmark" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <AdvancedCalculator
                                onCalculationComplete={(originalProblem, solution, explanation) => {
                                    handleAdvancedCalculation(originalProblem, solution, explanation);
                                    setShowAdvancedOptions(false);
                                }}
                            />
                        </View>
                    </SafeAreaView>
                </Modal>

                {renderUnitConverter()}

                {isLoading && (
                    <View style={sharedStyles.loadingOverlay}>
                        <Text style={sharedStyles.loadingText}>Processing image...</Text>
                    </View>
                )}
                <ThemedView style={styles.footer}>
                    <ThemedText style={[styles.versionText, { color: textColor, opacity: 0.5 }]}>
                        MathCalc v0.0.7
                    </ThemedText>
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
        padding: 50,
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
    keypadToggle: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        padding: 8,
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
    resultActionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    explainButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 5,
    },
    explainButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    scientificToggle: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 5,
    },
    scientificToggleText: {
        fontWeight: '600',
    },
    keypadContainer: {
        marginTop: 10,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    keypadButton: {
        width: '23%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    keypadButtonText: {
        fontSize: 24,
    },
    toolsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    toolButton: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    toolButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    converterContainer: {
        width: '90%',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    converterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    converterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unitTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    unitTypeButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    converterInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 18,
        marginBottom: 15,
    },
    unitSelectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    unitColumn: {
        width: '48%',
    },
    unitLabel: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    unitButtonContainer: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    unitButton: {
        width: '48%',
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    convertButton: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    convertButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepVisualizerContainer: {
        marginBottom: 20,
    },
    stepCard: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    stepText: {
        fontSize: 16,
        lineHeight: 22,
    },
    stepNavigator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    stepNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    stepNavText: {
        color: '#fff',
        marginHorizontal: 5,
    },
    stepCounter: {
        color: '#fff',
        fontWeight: 'bold',
    },
    swipeHint: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 5,
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
