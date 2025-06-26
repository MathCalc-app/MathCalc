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
    Keyboard, 
    ScrollView,
    Dimensions
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
    const [exercises, setExercises] = useState<any[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    const cameraRef = useRef<CameraViewType>(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const [keypadMode, setKeypadMode] = useState<'basic' | 'scientific'>('basic');

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

    const exerciseSwipeAnim = useRef(new Animated.Value(0)).current;

    const exercisePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) =>
                Math.abs(gestureState.dx) > 20,
            onPanResponderGrant: () => {
                exerciseSwipeAnim.setValue(0);
            },
            onPanResponderMove: (evt, gestureState) => {
                exerciseSwipeAnim.setValue(gestureState.dx);
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx > 120 && currentExerciseIndex > 0) {
                    Animated.timing(exerciseSwipeAnim, {
                        toValue: 300,
                        duration: 250,
                        useNativeDriver: true
                    }).start(() => {
                        const newIndex = currentExerciseIndex - 1;
                        setCurrentExerciseIndex(newIndex);
                        const exercise = exercises[newIndex];
                        setCurrentMathProblem(exercise);
                        setExpression(exercise.originalProblem);
                        setResult(exercise.solution);

                        if (exercise.explanation) {
                            const stepsArray = exercise.explanation
                                .split('\n')
                                .filter((step: string) => step.trim().length > 0);
                            setSteps(stepsArray);
                            setCurrentStepIndex(0);
                        }

                        if (exercise.latexExpression && exercise.latexExpression.length > 0) {
                            setLatexExpression(exercise.latexExpression);
                            setShowMathView(true);
                        } else {
                            setLatexExpression('');
                            setShowMathView(false);
                        }

                        exerciseSwipeAnim.setValue(0);
                    });
                } else if (gestureState.dx < -120 && currentExerciseIndex < exercises.length - 1) {
                    Animated.timing(exerciseSwipeAnim, {
                        toValue: -300,
                        duration: 250,
                        useNativeDriver: true
                    }).start(() => {
                        const newIndex = currentExerciseIndex + 1;
                        setCurrentExerciseIndex(newIndex);
                        const exercise = exercises[newIndex];
                        setCurrentMathProblem(exercise);
                        setExpression(exercise.originalProblem);
                        setResult(exercise.solution);

                        if (exercise.explanation) {
                            const stepsArray = exercise.explanation
                                .split('\n')
                                .filter((step: string) => step.trim().length > 0);
                            setSteps(stepsArray);
                            setCurrentStepIndex(0);
                        }

                        if (exercise.latexExpression && exercise.latexExpression.length > 0) {
                            setLatexExpression(exercise.latexExpression);
                            setShowMathView(true);
                        } else {
                            setLatexExpression('');
                            setShowMathView(false);
                        }

                        exerciseSwipeAnim.setValue(0);
                    });
                } else {
                    Animated.spring(exerciseSwipeAnim, {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                }
            }
        })
    ).current;

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

            const labeledDataRegex = /^[A-Za-z]+\s*:|\n[A-Za-z]+\s*:/;
            const hasMultipleLines = expression.includes('\n');
            const hasLabels = labeledDataRegex.test(expression);

            if (hasLabels || hasMultipleLines) {
                setResult(expression);

                const steps = [
                    "Detected labeled data or multi-line text input.",
                    "Format recognized as labeled expressions (e.g., A: value, B: value).",
                    "No calculation performed - displaying as formatted text."
                ];

                setSteps(steps);
                setCurrentStepIndex(0);

                const problem = {
                    originalProblem: expression,
                    solution: expression,
                    explanation: "This appears to be labeled data or multiple expressions (like A: value, B: value). " +
                        "This format is typically used for reference or to present multiple values. " +
                        "No calculation was performed as this is not a single mathematical expression.",
                    latexExpression: ''
                };

                const updatedExercises = [...exercises, problem];
                setExercises(updatedExercises);
                setCurrentExerciseIndex(updatedExercises.length - 1);
                setCurrentMathProblem(problem);

                await saveProblem(problem);
                await handleProblemSolved();
                await notifySolutionComplete("Labeled data saved");
                return;
            }

            let processedExpression = expression;
            const openParenCount = (expression.match(/\(/g) || []).length;
            const closeParenCount = (expression.match(/\)/g) || []).length;

            const steps = [];
            steps.push(`Start with the expression: ${expression}`);

            if (openParenCount > closeParenCount) {
                processedExpression += ')'.repeat(openParenCount - closeParenCount);
                steps.push(`Balance parentheses: ${processedExpression}`);
            }

            let cleanedExpression = processedExpression
                .replace(/x/g, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, 'pi')
                .replace(/\^/g, '**')
                .replace(/log10\(/g, 'log10(')
                .replace(/log\(/g, 'log(')
                .replace(/sin\(/g, 'sin(')
                .replace(/cos\(/g, 'cos(')
                .replace(/tan\(/g, 'tan(')
                .replace(/sqrt\(/g, 'sqrt(')
                .replace(/(\d+)!/g, 'factorial($1)');

            if (cleanedExpression !== processedExpression) {
                steps.push(`Convert to standard notation: ${cleanedExpression}`);
            }

            if (cleanedExpression.includes('(')) {
                steps.push(`Evaluate expressions inside parentheses`);

                let tempExpression = cleanedExpression;
                const parenthesesRegex = /\(([^()]+)\)/g;
                let match;

                let parenthesesReplaced = false;
                while ((match = parenthesesRegex.exec(cleanedExpression)) !== null) {
                    const innerExpression = match[1];
                    try {
                        const innerResult = math.evaluate(innerExpression);
                        tempExpression = tempExpression.replace(match[0], innerResult.toString());
                        steps.push(`Calculate (${innerExpression}) = ${innerResult}`);
                        parenthesesReplaced = true;
                    } catch (error) {
                        steps.push(`Error evaluating (${innerExpression})`);
                    }
                }

                if (parenthesesReplaced) {
                    cleanedExpression = tempExpression;
                    steps.push(`After evaluating parentheses: ${cleanedExpression}`);
                }
            }

            const functionRegex = /(sin|cos|tan|log|log10|sqrt)\(([^()]+)\)/g;
            let match;
            let functionReplaced = false;
            let tempExpression = cleanedExpression;

            while ((match = functionRegex.exec(cleanedExpression)) !== null) {
                const [fullMatch, funcName, argument] = match;
                try {
                    const funcResult = math.evaluate(fullMatch);
                    tempExpression = tempExpression.replace(fullMatch, funcResult.toString());
                    steps.push(`Calculate ${funcName}(${argument}) = ${funcResult}`);
                    functionReplaced = true;
                } catch (error) {
                    steps.push(`Error evaluating ${funcName}(${argument})`);
                }
            }

            if (functionReplaced) {
                cleanedExpression = tempExpression;
                steps.push(`After evaluating functions: ${cleanedExpression}`);
            }

            if (cleanedExpression.includes('**')) {
                steps.push(`Perform exponentiation operations`);
                const expRegex = /(\-?\d*\.?\d+)\*\*(\-?\d*\.?\d+)/;

                let expReplaced = false;
                while (expRegex.test(cleanedExpression)) {
                    cleanedExpression = cleanedExpression.replace(expRegex, (match, base, exponent) => {
                        const result = Math.pow(Number(base), Number(exponent));
                        steps.push(`Calculate ${base} ^ ${exponent} = ${result}`);
                        expReplaced = true;
                        return result.toString();
                    });
                }

                if (expReplaced) {
                    steps.push(`After exponentiation: ${cleanedExpression}`);
                }
            }

            if (cleanedExpression.includes('*') || cleanedExpression.includes('/')) {
                steps.push(`Perform multiplication and division operations`);

                const mdRegex = /(\-?\d*\.?\d+)([*/])(\-?\d*\.?\d+)/;
                let mdReplaced = false;

                while (mdRegex.test(cleanedExpression)) {
                    cleanedExpression = cleanedExpression.replace(mdRegex, (match, left, operator, right) => {
                        const leftNum = Number(left);
                        const rightNum = Number(right);
                        const result = operator === '*' ? leftNum * rightNum : leftNum / rightNum;
                        steps.push(`Calculate ${left} ${operator === '*' ? '×' : '÷'} ${right} = ${result}`);
                        mdReplaced = true;
                        return result.toString();
                    });
                }

                if (mdReplaced) {
                    steps.push(`After multiplication and division: ${cleanedExpression}`);
                }
            }

            if (cleanedExpression.includes('+') || /[^\d\.][\-]/.test(cleanedExpression)) {
                steps.push(`Perform addition and subtraction operations`);

                if (cleanedExpression.startsWith('-')) {
                    cleanedExpression = '0' + cleanedExpression;
                }

                const asRegex = /(\-?\d*\.?\d+)([\+\-])(\d*\.?\d+)/;
                let asReplaced = false;

                while (asRegex.test(cleanedExpression)) {
                    cleanedExpression = cleanedExpression.replace(asRegex, (match, left, operator, right) => {
                        const leftNum = Number(left);
                        const rightNum = Number(right);
                        const result = operator === '+' ? leftNum + rightNum : leftNum - rightNum;
                        steps.push(`Calculate ${left} ${operator} ${right} = ${result}`);
                        asReplaced = true;
                        return result.toString();
                    });
                }

                if (asReplaced) {
                    steps.push(`After addition and subtraction: ${cleanedExpression}`);
                }
            }

            try {
                const calculatedResult = math.evaluate(processedExpression
                    .replace(/x/g, '*')
                    .replace(/÷/g, '/'));
                const formattedResult = useScientificNotation ?
                    formatScientific(calculatedResult) : calculatedResult.toString();

                steps.push(`Final result: ${formattedResult}`);

                setResult(formattedResult);
                setSteps(steps);
                setCurrentStepIndex(0);

                const problem = {
                    originalProblem: expression,
                    solution: formattedResult,
                    explanation: steps.join('\n'),
                    latexExpression: ''
                };

                const updatedExercises = [...exercises, problem];
                setExercises(updatedExercises);
                setCurrentExerciseIndex(updatedExercises.length - 1);
                setCurrentMathProblem(problem);

                await saveProblem(problem);
                await handleProblemSolved();
                await notifySolutionComplete(expression);
                await schedulePracticeReminder(1);
            } catch (error) {
                setResult(expression);
                steps.push(`Could not evaluate as mathematical expression. Displaying as text.`);
                setSteps(steps);

                const problem = {
                    originalProblem: expression,
                    solution: expression,
                    explanation: steps.join('\n'),
                    latexExpression: ''
                };

                const updatedExercises = [...exercises, problem];
                setExercises(updatedExercises);
                setCurrentExerciseIndex(updatedExercises.length - 1);
                setCurrentMathProblem(problem);

                await saveProblem(problem);
            }
        } catch (error) {
            setResult(expression);
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

    const [angleUnit, setAngleUnit] = useState<'rad' | 'deg'>('rad');

    const handleAdvancedInput = (key: string) => {
        switch(key) {
            case 'sin':
                setExpression(prev => prev + 'sin(');
                break;
            case 'cos':
                setExpression(prev => prev + 'cos(');
                break;
            case 'tan':
                setExpression(prev => prev + 'tan(');
                break;
            case 'log':
                setExpression(prev => prev + 'log10(');
                break;
            case 'ln':
                setExpression(prev => prev + 'log(');
                break;
            case '√':
                setExpression(prev => prev + 'sqrt(');
                break;
            case 'π':
                setExpression(prev => prev + 'pi');
                break;
            case 'e':
                setExpression(prev => prev + 'e');
                break;
            case '^':
                setExpression(prev => prev + '^');
                break;
            case '!':
                setExpression(prev => prev + '!');
                break;
            case '%':
                setExpression(prev => prev + '%');
                break;
            case 'Rad/Deg':
                setAngleUnit(angleUnit === 'rad' ? 'deg' : 'rad');
                break;
            default:
                handleKeypadInput(key);
                break;
        }
    };

    const renderKeypad = () => {
        const basicKeys = [
            ['7', '8', '9', '÷'],
            ['4', '5', '6', 'x'],
            ['1', '2', '3', '-'],
            ['0', '.', '(', '+'],
            [')', 'C', '⌫', '=']
        ];

        const scientificKeys = [
            ['sin', 'cos', 'tan', 'π'],
            ['log', 'ln', 'e', '^'],
            ['√', '!', '%', '÷'],
            ['7', '8', '9', 'x'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['0', '.', '(', ')'],
            ['C', '⌫', `${angleUnit.toUpperCase()}`, '=']
        ];

        const keys = keypadMode === 'basic' ? basicKeys : scientificKeys;

        return (
            <View style={styles.keypadContainer}>
                <View style={styles.keypadModeToggle}>
                    <TouchableOpacity
                        style={[
                            styles.modeToggleButton,
                            {
                                backgroundColor: keypadMode === 'basic' ? tintColor : 'rgba(0,0,0,0.1)'
                            }
                        ]}
                        onPress={() => setKeypadMode('basic')}
                    >
                        <Text style={{
                            color: keypadMode === 'basic' ? '#fff' : textColor,
                            fontWeight: 'bold'
                        }}>
                            Basic
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.modeToggleButton,
                            {
                                backgroundColor: keypadMode === 'scientific' ? tintColor : 'rgba(0,0,0,0.1)'
                            }
                        ]}
                        onPress={() => setKeypadMode('scientific')}
                    >
                        <Text style={{
                            color: keypadMode === 'scientific' ? '#fff' : textColor,
                            fontWeight: 'bold'
                        }}>
                            Scientific
                        </Text>
                    </TouchableOpacity>
                </View>

                {keys.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                        {row.map((key) => {
                            const isSpecialKey = ['C', '⌫', '=', 'RAD', 'DEG'].includes(key);
                            const isOperator = ['÷', 'x', '-', '+', '^', '!', '%'].includes(key);
                            const isFunction = ['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(key);
                            const isConstant = ['π', 'e'].includes(key);

                            let buttonBgColor = isSpecialKey ? tintColor :
                                isOperator ? 'rgba(0,0,0,0.15)' :
                                    isFunction ? 'rgba(0,0,0,0.2)' :
                                        isConstant ? 'rgba(0,0,0,0.25)' :
                                            inputBackground;

                            let buttonTextColor = isSpecialKey ? '#fff' : textColor;
                            let fontWeight = isSpecialKey || isOperator || isFunction || isConstant ? 'bold' : 'normal';

                            const fontSize = ['sin', 'cos', 'tan', 'log', 'ln', 'RAD', 'DEG'].includes(key) ? 16 : 22;

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.keypadButton,
                                        {
                                            backgroundColor: buttonBgColor,
                                            width: keypadMode === 'scientific' ? '24%' : '23%',
                                            height: keypadMode === 'scientific' ? 50 : 60,
                                        }
                                    ]}
                                    onPress={() => {
                                        if (key === 'RAD' || key === 'DEG') {
                                            setAngleUnit(angleUnit === 'rad' ? 'deg' : 'rad');
                                        } else {
                                            keypadMode === 'basic' ?
                                                handleKeypadInput(key) : handleAdvancedInput(key);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.keypadButtonText,
                                        {
                                            color: buttonTextColor,
                                            fontWeight: fontWeight as "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | "ultralight" | "thin" | "light" | "medium",
                                            fontSize: fontSize
                                        }
                                    ]}>
                                        {key}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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
                const isLabeledData = /[A-Za-z]+\s*:/.test(result.originalProblem);

                setExpression(result.originalProblem);
                setResult(String(result.solution));

                if (isLabeledData && result.solution === result.originalProblem) {
                    result.explanation = "This appears to be labeled data (like A: value, B: value). " +
                        "This format is typically used for reference or to present multiple values. " +
                        "No calculation was performed as this is not a single mathematical expression.";
                }

                if (result.exercises && result.exercises.length > 0) {
                    setExercises(result.exercises);
                    setCurrentExerciseIndex(0);
                    setCurrentMathProblem(result.exercises[0]);

                    if (result.exercises[0].explanation) {
                        const stepsArray = result.exercises[0].explanation
                            .split('\n')
                            .filter(step => step.trim().length > 0);
                        setSteps(stepsArray);
                        setCurrentStepIndex(0);
                    }

                    if (result.exercises[0].latexExpression && result.exercises[0].latexExpression.length > 0) {
                        setLatexExpression(result.exercises[0].latexExpression);
                        setShowMathView(true);
                    }
                } else {
                    const updatedExercises = [...exercises, result];
                    setExercises(updatedExercises);
                    setCurrentExerciseIndex(updatedExercises.length - 1);
                    setCurrentMathProblem(result);

                    if (result.explanation) {
                        const stepsArray = result.explanation
                            .split('\n')
                            .filter(step => step.trim().length > 0);
                        setSteps(stepsArray);
                        setCurrentStepIndex(0);
                    }

                    if (result.latexExpression && result.latexExpression.length > 0) {
                        setLatexExpression(result.latexExpression);
                        setShowMathView(true);
                    } else {
                        setLatexExpression('');
                        setShowMathView(false);
                    }
                }

                if (result.originalProblem && result.solution) {
                    const problemToSave = {
                        originalProblem: result.originalProblem,
                        solution: result.solution,
                        explanation: result.explanation || '',
                        latexExpression: result.latexExpression || ''
                    };

                    await saveProblem(problemToSave);
                    await handleProblemSolved();
                    await notifySolutionComplete(result.originalProblem);
                    await schedulePracticeReminder(1);
                }

                const currentResult = result.exercises ? result.exercises[0] : result;
                if (currentResult.explanation && currentResult.explanation.length > 0) {
                    console.log('Explanation:', currentResult.explanation);
                    setTimeout(() => {
                        Alert.alert(
                            'Solution',
                            currentResult.explanation.length > 200
                                ? currentResult.explanation.substring(0, 200) + '...'
                                : currentResult.explanation,
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

        const screenWidth = Dimensions.get('window').width;
        const cardWidth = screenWidth - 40;

        return (
            <View style={styles.stepVisualizerContainer}>
                <Text style={[styles.stepCounter, { color: textColor, textAlign: 'center', marginBottom: 10 }]}>
                    Steps: {currentStepIndex + 1} / {steps.length}
                </Text>

                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => {
                        const offsetX = event.nativeEvent.contentOffset.x;
                        const pageIndex = Math.round(offsetX / (cardWidth + 20));
                        setCurrentStepIndex(pageIndex);
                    }}
                    contentContainerStyle={styles.stepsScrollContainer}
                    snapToInterval={cardWidth + 20}
                    decelerationRate="fast"
                >
                    {steps.map((step, index) => (
                        <View
                            key={`step-${index}`}
                            style={[
                                styles.stepCard,
                                {
                                    backgroundColor: tintColor,
                                    width: cardWidth,
                                    marginRight: index < steps.length - 1 ? 20 : 0
                                }
                            ]}
                        >
                            <Text style={[styles.stepText, { color: '#fff' }]}>
                                {step}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                <Text style={[styles.swipeHint, { color: textColor, opacity: 0.7 }]}>
                    Swipe left/right to navigate between steps
                </Text>
            </View>
        );
    };

    const renderExerciseNavigator = () => {
        if (exercises.length <= 1) return null;

        return (
            <View style={styles.exerciseNavigatorContainer}>
                <Text style={[styles.exerciseCounter, { color: textColor, textAlign: 'center', marginBottom: 10 }]}>
                    Exercise: {currentExerciseIndex + 1} / {exercises.length}
                </Text>

                <View style={styles.exerciseNavButtons}>
                    <TouchableOpacity
                        style={[
                            styles.exerciseNavButton,
                            { backgroundColor: tintColor, opacity: currentExerciseIndex > 0 ? 1 : 0.5 }
                        ]}
                        onPress={() => {
                            if (currentExerciseIndex > 0) {
                                const newIndex = currentExerciseIndex - 1;
                                setCurrentExerciseIndex(newIndex);
                                const exercise = exercises[newIndex];
                                setCurrentMathProblem(exercise);
                                setExpression(exercise.originalProblem);
                                setResult(exercise.solution);

                                if (exercise.explanation) {
                                    const stepsArray = exercise.explanation
                                        .split('\n')
                                        .filter((step: string) => step.trim().length > 0);
                                    setSteps(stepsArray);
                                    setCurrentStepIndex(0);
                                }

                                if (exercise.latexExpression && exercise.latexExpression.length > 0) {
                                    setLatexExpression(exercise.latexExpression);
                                    setShowMathView(true);
                                } else {
                                    setLatexExpression('');
                                    setShowMathView(false);
                                }
                            }
                        }}
                        disabled={currentExerciseIndex === 0}
                    >
                        <IconSymbol name="chevron.left" size={20} color="#fff" />
                        <Text style={styles.exerciseNavButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.exerciseNavButton,
                            { backgroundColor: tintColor, opacity: currentExerciseIndex < exercises.length - 1 ? 1 : 0.5 }
                        ]}
                        onPress={() => {
                            if (currentExerciseIndex < exercises.length - 1) {
                                const newIndex = currentExerciseIndex + 1;
                                setCurrentExerciseIndex(newIndex);
                                const exercise = exercises[newIndex];
                                setCurrentMathProblem(exercise);
                                setExpression(exercise.originalProblem);
                                setResult(exercise.solution);

                                if (exercise.explanation) {
                                    const stepsArray = exercise.explanation
                                        .split('\n')
                                        .filter((step: string) => step.trim().length > 0);
                                    setSteps(stepsArray);
                                    setCurrentStepIndex(0);
                                }

                                if (exercise.latexExpression && exercise.latexExpression.length > 0) {
                                    setLatexExpression(exercise.latexExpression);
                                    setShowMathView(true);
                                } else {
                                    setLatexExpression('');
                                    setShowMathView(false);
                                }
                            }
                        }}
                        disabled={currentExerciseIndex === exercises.length - 1}
                    >
                        <Text style={styles.exerciseNavButtonText}>Next</Text>
                        <IconSymbol name="chevron.right" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.swipeHint, { color: textColor, opacity: 0.7 }]}>
                    Navigate between different exercises
                </Text>
            </View>
        );
    };

    const clearCalculator = () => {
        setExpression('');
        setResult('');
        setSteps([]);
        setCurrentStepIndex(0);
        setCurrentMathProblem(null);
        setShowMathView(false);
        setLatexExpression('');
        setExercises([]);
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
                                <ScrollView style={{maxHeight: 200}}>
                                    <ThemedText style={styles.expressionText}>
                                        {expression.split('\n').map((line, i) => (
                                            <React.Fragment key={i}>
                                                {i > 0 && '\n'}
                                                {line}
                                            </React.Fragment>
                                        ))}
                                    </ThemedText>
                                </ScrollView>
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

                            <Animated.View
                                {...(exercises.length > 1 ? exercisePanResponder.panHandlers : {})}
                                style={[
                                    styles.resultContainer,
                                    {
                                        backgroundColor: tintColor,
                                        transform: [{ translateX: exerciseSwipeAnim }]
                                    }
                                ]}
                            >
                                {exercises.length > 1 && (
                                    <View style={styles.swipeIndicatorContainer}>
                                        <View style={styles.swipeIndicator} />
                                    </View>
                                )}

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

                                {exercises.length > 1 && (
                                    <Text style={[styles.exerciseIndicator, { color: '#fff', opacity: 0.7 }]}>
                                        Exercise {currentExerciseIndex + 1} of {exercises.length}
                                    </Text>
                                )}
                            </Animated.View>

                            {exercises.length > 1 && renderExerciseNavigator()}

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
                                            onPress={clearCalculator}
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
                    visible={showAdvancedOptions}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowAdvancedOptions(false)}
                    statusBarTranslucent={true}
                >
                    <SafeAreaView style={{flex: 1, backgroundColor: backgroundColor}}>
                        <View style={{flex: 1, padding: 10}}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 15,
                                paddingVertical: 10,
                            }}>
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 8,
                                        paddingHorizontal: 4,
                                    }}
                                    onPress={() => setShowAdvancedOptions(false)}
                                >
                                    <IconSymbol name="chevron.left" size={24} color={textColor} />
                                    <Text style={{ color: textColor, marginLeft: 4, fontSize: 16 }}>Back</Text>
                                </TouchableOpacity>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: textColor,
                                    textAlign: 'center',
                                }}>Advanced Calculator</Text>
                                <View style={{ width: 80 }} />
                            </View>
                            
                            <ScrollView 
                                style={{flex: 1}} 
                                contentContainerStyle={{paddingBottom: 20}}
                            >
                                <AdvancedCalculator
                                    onCalculationComplete={(originalProblem, solution, explanation) => {
                                        handleAdvancedCalculation(originalProblem, solution, explanation);
                                        setShowAdvancedOptions(false);
                                    }}
                                />
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </Modal>

                <Modal
                    visible={showExplanation}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowExplanation(false)}
                    statusBarTranslucent={true}
                >
                    {currentMathProblem && (
                        <SafeAreaView style={{flex: 1, backgroundColor: backgroundColor}}>
                            <MathExplanation
                                mathProblem={currentMathProblem}
                                onClose={() => setShowExplanation(false)}
                            />
                        </SafeAreaView>
                    )}
                </Modal>

                {renderUnitConverter()}

                {isLoading && (
                    <View style={sharedStyles.loadingOverlay}>
                        <Text style={sharedStyles.loadingText}>Processing image...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    exerciseNavigatorContainer: {
        marginBottom: 20,
    },
    exerciseCounter: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    exerciseNavButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    exerciseNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    exerciseNavButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginHorizontal: 5,
    },
    stepsScrollContainer: {
        alignItems: 'center',
    },
    keypadModeToggle: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    modeToggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginHorizontal: 5,
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
        lineHeight: 32,
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
    swipeIndicatorContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    swipeIndicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2.5,
    },
    exerciseIndicator: {
        textAlign: 'center',
        fontSize: 12,
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
        fontSize: 14,
    }
});
