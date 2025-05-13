
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as math from 'mathjs';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';

type AdvancedCalculatorProps = {
    onCalculationComplete: (originalProblem: string, solution: string, explanation: string) => void;
};

export default function AdvancedCalculator({ onCalculationComplete }: AdvancedCalculatorProps) {
    const [activeTab, setActiveTab] = useState<'matrix' | 'stats' | 'constants' | 'probability'>('matrix');
    const { effectiveTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#1c1c1e';

    const inputBackground = effectiveTheme === 'light'
        ? '#ffffff'
        : '#252728';

    const inputBorder = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(255,255,255,0.1)';

    const [matrixInputA, setMatrixInputA] = useState<string>("[[1, 2], [3, 4]]");
    const [matrixInputB, setMatrixInputB] = useState<string>("[[5, 6], [7, 8]]");
    const [matrixOperation, setMatrixOperation] = useState<'add' | 'multiply' | 'determinant' | 'inverse'>('add');

    const [dataSet, setDataSet] = useState<string>('1, 2, 3, 4, 5');
    const [statOperation, setStatOperation] = useState<'mean' | 'median' | 'std' | 'min' | 'max'>('mean');

    const [probabilityType, setProbabilityType] = useState<'basic' | 'binomial' | 'normal'>('basic');
    const [successProb, setSuccessProb] = useState<string>('0.5');
    const [trials, setTrials] = useState<string>('10');
    const [successCount, setSuccessCount] = useState<string>('5');
    const [mean, setMean] = useState<string>('0');
    const [stdDev, setStdDev] = useState<string>('1');
    const [xValue, setXValue] = useState<string>('0');
    const [rangeStart, setRangeStart] = useState<string>('-1');
    const [rangeEnd, setRangeEnd] = useState<string>('1');
    const [probRange, setProbRange] = useState<'lessThan' | 'greaterThan' | 'between'>('lessThan');

    const constants = [
        { symbol: 'π', name: 'Pi', value: math.pi },
        { symbol: 'e', name: 'Euler\'s Number', value: math.e },
        { symbol: 'φ', name: 'Golden Ratio', value: 1.618033988749895 },
        { symbol: 'γ', name: 'Euler-Mascheroni', value: 0.5772156649015329 }
    ];

    const factorial = (n: number): number => {
        if (n === 0 || n === 1) return 1;
        return n * factorial(n - 1);
    };

    const combination = (n: number, r: number): number => {
        return factorial(n) / (factorial(r) * factorial(n - r));
    };

    const normalCDF = (x: number): number => {
        return 0.5 * (1 + math.erf(x / Math.sqrt(2)));
    };

    const calculateMatrix = () => {
        try {
            const matrixA = math.evaluate(matrixInputA);
            let result: any;
            let explanation = '';

            if (matrixOperation === 'add') {
                const matrixB = math.evaluate(matrixInputB);
                result = math.add(matrixA, matrixB);
                explanation = `To add these matrices, we add corresponding elements.\n\nMatrix A:\n${matrixInputA}\n\nMatrix B:\n${matrixInputB}\n\nResult:\n${JSON.stringify(result)}`;
            } else if (matrixOperation === 'multiply') {
                const matrixB = math.evaluate(matrixInputB);
                result = math.multiply(matrixA, matrixB);
                explanation = `To multiply matrices, we use the dot product of rows and columns.\n\nMatrix A:\n${matrixInputA}\n\nMatrix B:\n${matrixInputB}\n\nResult:\n${JSON.stringify(result)}`;
            } else if (matrixOperation === 'determinant') {
                result = math.det(matrixA);
                explanation = `The determinant of a matrix is a scalar value that represents the scaling factor of the linear transformation.\n\nMatrix:\n${matrixInputA}\n\nDeterminant: ${result}`;
            } else if (matrixOperation === 'inverse') {
                result = math.inv(matrixA);
                explanation = `The inverse of a matrix A is another matrix A^-1 such that A × A^-1 = I (identity matrix).\n\nMatrix:\n${matrixInputA}\n\nInverse:\n${JSON.stringify(result)}`;
            }

            onCalculationComplete(
                `Matrix ${matrixOperation} operation: ${matrixInputA}`,
                JSON.stringify(result),
                explanation
            );
        } catch (error) {
            console.error('Matrix calculation error:', error);
            onCalculationComplete(
                `Matrix ${matrixOperation} operation`,
                'Error in calculation',
                'Make sure your matrices are valid for this operation. For example, for addition both matrices must be the same size, and for multiplication the number of columns in A must equal the number of rows in B.'
            );
        }
    };

    const calculateStatistics = () => {
        try {
            const data = dataSet.split(',').map(num => parseFloat(num.trim())).filter(n => !isNaN(n));
            let result: number = 0;
            let explanation = '';

            if (statOperation === 'mean') {
                result = Number(math.mean(data));
                explanation = `The mean (average) is calculated by summing all values and dividing by the count.\n\nData: [${data}]\n\nSum: ${data.reduce((sum, val) => sum + val, 0)}\nCount: ${data.length}\nMean: ${result}`;
            } else if (statOperation === 'median') {
                result = math.median(data);
                explanation = `The median is the middle value when data is sorted.\n\nData: [${data}]\n\nSorted: [${[...data].sort((a, b) => a - b)}]\nMedian: ${result}`;
            } else if (statOperation === 'std') {
                result = Number(math.std(data));
                explanation = `Standard deviation measures the amount of variation in a set of values.\n\nData: [${data}]\n\nMean: ${math.mean(data)}\nStandard Deviation: ${result}`;
            } else if (statOperation === 'min') {
                result = math.min(data);
                explanation = `The minimum is the smallest value in the dataset.\n\nData: [${data}]\n\nMinimum: ${result}`;
            } else if (statOperation === 'max') {
                result = math.max(data);
                explanation = `The maximum is the largest value in the dataset.\n\nData: [${data}]\n\nMaximum: ${result}`;
            }

            onCalculationComplete(
                `Statistical ${statOperation} of [${dataSet}]`,
                result.toString(),
                explanation
            );
        } catch (error) {
            console.error('Statistical calculation error:', error);
            onCalculationComplete(
                `Statistical ${statOperation}`,
                'Error in calculation',
                'Please check your input data format. Enter numbers separated by commas.'
            );
        }
    };

    const calculateProbability = () => {
        try {
            let result: number = 0;
            let explanation = '';

            if (probabilityType === 'basic') {
                const p = parseFloat(successProb);
                result = p;
                explanation = `Basic probability of success: ${p}\n\nThis represents the probability of a single event occurring.`;
            } else if (probabilityType === 'binomial') {
                const p = parseFloat(successProb);
                const n = parseInt(trials);
                const k = parseInt(successCount);

                result = combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);

                explanation = `Binomial probability calculation:\n\n` +
                    `P(X = ${k}) = (${n} choose ${k}) × ${p}^${k} × (1-${p})^(${n}-${k})\n\n` +
                    `= ${combination(n, k)} × ${Math.pow(p, k).toFixed(6)} × ${Math.pow(1 - p, n - k).toFixed(6)}\n\n` +
                    `= ${result.toFixed(6)}\n\n` +
                    `This represents the probability of getting exactly ${k} successes in ${n} trials, where the probability of success in a single trial is ${p}.`;
            } else if (probabilityType === 'normal') {
                const mu = parseFloat(mean);
                const sigma = parseFloat(stdDev);

                if (probRange === 'lessThan') {
                    const x = parseFloat(xValue);
                    const z = (x - mu) / sigma;
                    result = normalCDF(z);
                    explanation = `Normal distribution probability P(X < ${x}):\n\n` +
                        `With mean μ = ${mu} and standard deviation σ = ${sigma}:\n\n` +
                        `First, we calculate the z-score: z = (x - μ) / σ = (${x} - ${mu}) / ${sigma} = ${z.toFixed(4)}\n\n` +
                        `Then we find the cumulative probability: P(Z < ${z.toFixed(4)}) = ${result.toFixed(6)}\n\n` +
                        `This is the probability that a random variable from this normal distribution takes a value less than ${x}.`;
                } else if (probRange === 'greaterThan') {
                    const x = parseFloat(xValue);
                    const z = (x - mu) / sigma;
                    result = 1 - normalCDF(z);
                    explanation = `Normal distribution probability P(X > ${x}):\n\n` +
                        `With mean μ = ${mu} and standard deviation σ = ${sigma}:\n\n` +
                        `First, we calculate the z-score: z = (x - μ) / σ = (${x} - ${mu}) / ${sigma} = ${z.toFixed(4)}\n\n` +
                        `Then we find the cumulative probability: P(Z > ${z.toFixed(4)}) = 1 - P(Z < ${z.toFixed(4)}) = 1 - ${normalCDF(z).toFixed(6)} = ${result.toFixed(6)}\n\n` +
                        `This is the probability that a random variable from this normal distribution takes a value greater than ${x}.`;
                } else {
                    const a = parseFloat(rangeStart);
                    const b = parseFloat(rangeEnd);
                    const za = (a - mu) / sigma;
                    const zb = (b - mu) / sigma;
                    result = normalCDF(zb) - normalCDF(za);
                    explanation = `Normal distribution probability P(${a} < X < ${b}):\n\n` +
                        `With mean μ = ${mu} and standard deviation σ = ${sigma}:\n\n` +
                        `For the lower bound: z_a = (${a} - ${mu}) / ${sigma} = ${za.toFixed(4)}\n` +
                        `For the upper bound: z_b = (${b} - ${mu}) / ${sigma} = ${zb.toFixed(4)}\n\n` +
                        `The probability is: P(${a} < X < ${b}) = P(Z < ${zb.toFixed(4)}) - P(Z < ${za.toFixed(4)})\n` +
                        `= ${normalCDF(zb).toFixed(6)} - ${normalCDF(za).toFixed(6)} = ${result.toFixed(6)}\n\n` +
                        `This is the probability that a random variable from this normal distribution takes a value between ${a} and ${b}.`;
                }
            }

            onCalculationComplete(
                `Probability calculation (${probabilityType})`,
                result.toFixed(6),
                explanation
            );
        } catch (error) {
            console.error('Probability calculation error:', error);
            onCalculationComplete(
                `Probability calculation`,
                'Error in calculation',
                'Please check your input values and try again.'
            );
        }
    };

    const useConstant = (constant: typeof constants[0]) => {
        onCalculationComplete(
            `${constant.name} (${constant.symbol})`,
            constant.value.toString(),
            `${constant.name} (${constant.symbol}) has a value of ${constant.value}.\n\nThis constant is frequently used in various mathematical and scientific calculations.`
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'matrix':
                return (
                    <View style={styles.tabContent}>
                        <ThemedText type="subtitle">Matrix Operations</ThemedText>
                        <View style={styles.inputGroup}>
                            <ThemedText>Matrix A:</ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: inputBackground,
                                        borderColor: inputBorder,
                                        color: textColor
                                    }
                                ]}
                                value={matrixInputA}
                                onChangeText={setMatrixInputA}
                                placeholder="[[1, 2], [3, 4]]"
                                placeholderTextColor="#888"
                            />
                        </View>

                        {(matrixOperation === 'add' || matrixOperation === 'multiply') && (
                            <View style={styles.inputGroup}>
                                <ThemedText>Matrix B:</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={matrixInputB}
                                    onChangeText={setMatrixInputB}
                                    placeholder="[[5, 6], [7, 8]]"
                                    placeholderTextColor="#888"
                                />
                            </View>
                        )}

                        <View style={styles.operationSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    matrixOperation === 'add' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setMatrixOperation('add')}
                            >
                                <ThemedText style={matrixOperation === 'add' ? { color: '#fff' } : {}}>Add</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    matrixOperation === 'multiply' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setMatrixOperation('multiply')}
                            >
                                <ThemedText style={matrixOperation === 'multiply' ? { color: '#fff' } : {}}>Multiply</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    matrixOperation === 'determinant' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setMatrixOperation('determinant')}
                            >
                                <ThemedText style={matrixOperation === 'determinant' ? { color: '#fff' } : {}}>Determinant</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    matrixOperation === 'inverse' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setMatrixOperation('inverse')}
                            >
                                <ThemedText style={matrixOperation === 'inverse' ? { color: '#fff' } : {}}>Inverse</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: tintColor }]}
                            onPress={calculateMatrix}
                        >
                            <ThemedText style={styles.buttonText}>Calculate</ThemedText>
                        </TouchableOpacity>
                    </View>
                );

            case 'stats':
                return (
                    <View style={styles.tabContent}>
                        <ThemedText type="subtitle">Statistical Functions</ThemedText>
                        <View style={styles.inputGroup}>
                            <ThemedText>Data (comma separated):</ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: inputBackground,
                                        borderColor: inputBorder,
                                        color: textColor
                                    }
                                ]}
                                value={dataSet}
                                onChangeText={setDataSet}
                                placeholder="1, 2, 3, 4, 5"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.operationSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    statOperation === 'mean' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setStatOperation('mean')}
                            >
                                <ThemedText style={statOperation === 'mean' ? { color: '#fff' } : {}}>Mean</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    statOperation === 'median' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setStatOperation('median')}
                            >
                                <ThemedText style={statOperation === 'median' ? { color: '#fff' } : {}}>Median</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    statOperation === 'std' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setStatOperation('std')}
                            >
                                <ThemedText style={statOperation === 'std' ? { color: '#fff' } : {}}>Std Dev</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    statOperation === 'min' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setStatOperation('min')}
                            >
                                <ThemedText style={statOperation === 'min' ? { color: '#fff' } : {}}>Min</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    statOperation === 'max' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setStatOperation('max')}
                            >
                                <ThemedText style={statOperation === 'max' ? { color: '#fff' } : {}}>Max</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: tintColor }]}
                            onPress={calculateStatistics}
                        >
                            <ThemedText style={styles.buttonText}>Calculate</ThemedText>
                        </TouchableOpacity>
                    </View>
                );

            case 'probability':
                return (
                    <View style={styles.tabContent}>
                        <ThemedText type="subtitle">Probability Calculator</ThemedText>

                        <View style={styles.operationSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    probabilityType === 'basic' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setProbabilityType('basic')}
                            >
                                <ThemedText style={probabilityType === 'basic' ? { color: '#fff' } : {}}>Basic</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    probabilityType === 'binomial' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setProbabilityType('binomial')}
                            >
                                <ThemedText style={probabilityType === 'binomial' ? { color: '#fff' } : {}}>Binomial</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.operationButton,
                                    probabilityType === 'normal' && { backgroundColor: tintColor }
                                ]}
                                onPress={() => setProbabilityType('normal')}
                            >
                                <ThemedText style={probabilityType === 'normal' ? { color: '#fff' } : {}}>Normal</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {probabilityType === 'basic' && (
                            <View style={styles.inputGroup}>
                                <ThemedText>Probability of success:</ThemedText>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={successProb}
                                    onChangeText={setSuccessProb}
                                    placeholder="0.5"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                />
                            </View>
                        )}

                        {probabilityType === 'binomial' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <ThemedText>Probability of success in a single trial:</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={successProb}
                                        onChangeText={setSuccessProb}
                                        placeholder="0.5"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <ThemedText>Number of trials:</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={trials}
                                        onChangeText={setTrials}
                                        placeholder="10"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <ThemedText>Number of successes:</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={successCount}
                                        onChangeText={setSuccessCount}
                                        placeholder="5"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </>
                        )}

                        {probabilityType === 'normal' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <ThemedText>Mean (μ):</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={mean}
                                        onChangeText={setMean}
                                        placeholder="0"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <ThemedText>Standard deviation (σ):</ThemedText>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={stdDev}
                                        onChangeText={setStdDev}
                                        placeholder="1"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.operationSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.operationButton,
                                            probRange === 'lessThan' && { backgroundColor: tintColor }
                                        ]}
                                        onPress={() => setProbRange('lessThan')}
                                    >
                                        <ThemedText style={probRange === 'lessThan' ? { color: '#fff' } : {}}>P(X &lt; x)</ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.operationButton,
                                            probRange === 'greaterThan' && { backgroundColor: tintColor }
                                        ]}
                                        onPress={() => setProbRange('greaterThan')}
                                    >
                                        <ThemedText style={probRange === 'greaterThan' ? { color: '#fff' } : {}}>P(X &gt; x)</ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.operationButton,
                                            probRange === 'between' && { backgroundColor: tintColor }
                                        ]}
                                        onPress={() => setProbRange('between')}
                                    >
                                        <ThemedText style={probRange === 'between' ? { color: '#fff' } : {}}>P(a &lt; X &lt; b)</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                {(probRange === 'lessThan' || probRange === 'greaterThan') && (
                                    <View style={styles.inputGroup}>
                                        <ThemedText>Value of x:</ThemedText>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: inputBackground,
                                                    borderColor: inputBorder,
                                                    color: textColor
                                                }
                                            ]}
                                            value={xValue}
                                            onChangeText={setXValue}
                                            placeholder="0"
                                            placeholderTextColor="#888"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}

                                {probRange === 'between' && (
                                    <>
                                        <View style={styles.inputGroup}>
                                            <ThemedText>Lower bound (a):</ThemedText>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    {
                                                        backgroundColor: inputBackground,
                                                        borderColor: inputBorder,
                                                        color: textColor
                                                    }
                                                ]}
                                                value={rangeStart}
                                                onChangeText={setRangeStart}
                                                placeholder="-1"
                                                placeholderTextColor="#888"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <ThemedText>Upper bound (b):</ThemedText>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    {
                                                        backgroundColor: inputBackground,
                                                        borderColor: inputBorder,
                                                        color: textColor
                                                    }
                                                ]}
                                                value={rangeEnd}
                                                onChangeText={setRangeEnd}
                                                placeholder="1"
                                                placeholderTextColor="#888"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </>
                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: tintColor }]}
                            onPress={calculateProbability}
                        >
                            <ThemedText style={styles.buttonText}>Calculate Probability</ThemedText>
                        </TouchableOpacity>
                    </View>
                );

            case 'constants':
                return (
                    <View style={styles.tabContent}>
                        <ThemedText type="subtitle">Mathematical Constants</ThemedText>
                        <ScrollView style={styles.constantsContainer}>
                            {constants.map((constant, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.constantItem, { backgroundColor: cardBackground }]}
                                    onPress={() => useConstant(constant)}
                                >
                                    <ThemedText style={styles.constantSymbol}>{constant.symbol}</ThemedText>
                                    <View>
                                        <ThemedText style={styles.constantName}>{constant.name}</ThemedText>
                                        <ThemedText style={styles.constantValue}>{constant.value}</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}

                        </ScrollView>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'matrix' && { backgroundColor: tintColor }]}
                    onPress={() => setActiveTab('matrix')}
                >
                    <IconSymbol name="square.grid.3x3" size={20} color={activeTab === 'matrix' ? '#fff' : textColor} />
                    <ThemedText style={[styles.tabText, activeTab === 'matrix' && { color: '#fff' }]}>Matrix</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'stats' && { backgroundColor: tintColor }]}
                    onPress={() => setActiveTab('stats')}
                >
                    <IconSymbol name="chart.bar" size={20} color={activeTab === 'stats' ? '#fff' : textColor} />
                    <ThemedText style={[styles.tabText, activeTab === 'stats' && { color: '#fff' }]}>Stats</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'probability' && { backgroundColor: tintColor }]}
                    onPress={() => setActiveTab('probability')}
                >
                    <IconSymbol name="dice" size={20} color={activeTab === 'probability' ? '#fff' : textColor} />
                    <ThemedText style={[styles.tabText, activeTab === 'probability' && { color: '#fff' }]}>Probability</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'constants' && { backgroundColor: tintColor }]}
                    onPress={() => setActiveTab('constants')}
                >
                    <IconSymbol name="function" size={20} color={activeTab === 'constants' ? '#fff' : textColor} />
                    <ThemedText style={[styles.tabText, activeTab === 'constants' && { color: '#fff' }]}>Constants</ThemedText>
                </TouchableOpacity>
            </View>

            {renderTabContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        flex: 1,
    },
    tabText: {
        marginLeft: 5,
        fontSize: 13,
    },
    tabContent: {
        padding: 15,
    },
    inputGroup: {
        marginBottom: 10,
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    operationSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    operationButton: {
        padding: 8,
        borderRadius: 6,
        margin: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    actionButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    constantsContainer: {
        maxHeight: 200,
    },
    constantItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        alignItems: 'center',
    },
    constantSymbol: {
        fontSize: 24,
        marginRight: 15,
        fontWeight: 'bold',
    },
    constantName: {
        fontWeight: '500',
    },
    constantValue: {
        opacity: 0.7,
    }
});
