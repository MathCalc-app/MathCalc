import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MathGraph from '@/components/MathGraph';
import Math3DVisualizer from '@/components/Math3DVisualizer';
import { useThemeColor } from '@/hooks/useThemeColor';
import { sharedStyles } from '@/assets/styles/sharedStyles';
import { useTheme } from '@/contexts/ThemeContext';
import {AppFooter} from "@/components/AppFooter";

export default function VisualizationScreen() {
    const [equation2D, setEquation2D] = useState('x^2');
    const [equation3D, setEquation3D] = useState('sin(x) * cos(y)');
    const [paramX, setParamX] = useState('cos(t)');
    const [paramY, setParamY] = useState('sin(t)');
    const [polarR, setPolarR] = useState('cos(2*theta)');
    const [tRange, setTRange] = useState({min: 0, max: 2 * Math.PI});
    const [thetaRange, setThetaRange] = useState({min: 0, max: 2 * Math.PI});
    const [graphType, setGraphType] = useState<'cartesian' | 'parametric' | 'polar'>('cartesian');
    const [showGraph, setShowGraph] = useState(true);
    const [show3D, setShow3D] = useState(false);
    const [xRange, setXRange] = useState({min: -10, max: 10});
    const [yRange, setYRange] = useState({min: -10, max: 10});
    const [zRange, setZRange] = useState({min: -5, max: 5});

    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const inputBackground = effectiveTheme === 'light'
        ? '#ffffff'
        : '#252728';

    const inputBorder = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(255,255,255,0.1)';

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#1c1c1e';

    const handleVisualize2D = () => {
        setShowGraph(true);
    };

    const handleVisualize3D = () => {
        setShow3D(true);
    };

    const render2DGraphOptions = () => {
        return (
            <View style={styles.graphTypeContainer}>
                <TouchableOpacity
                    style={[
                        styles.graphTypeButton,
                        graphType === 'cartesian' && { backgroundColor: tintColor }
                    ]}
                    onPress={() => setGraphType('cartesian')}
                >
                    <ThemedText style={graphType === 'cartesian' ? { color: '#fff', fontWeight: 'bold' } : null}>
                        Cartesian
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.graphTypeButton,
                        graphType === 'parametric' && { backgroundColor: tintColor }
                    ]}
                    onPress={() => setGraphType('parametric')}
                >
                    <ThemedText style={graphType === 'parametric' ? { color: '#fff', fontWeight: 'bold' } : null}>
                        Parametric
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.graphTypeButton,
                        graphType === 'polar' && { backgroundColor: tintColor }
                    ]}
                    onPress={() => setGraphType('polar')}
                >
                    <ThemedText style={graphType === 'polar' ? { color: '#fff', fontWeight: 'bold' } : null}>
                        Polar
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    };

    const render2DInputFields = () => {
        if (graphType === 'cartesian') {
            return (
                <View style={styles.inputContainer}>
                    <ThemedText>f(x) = </ThemedText>
                    <TextInput
                        style={[
                            styles.equationInput,
                            {
                                backgroundColor: inputBackground,
                                borderColor: inputBorder,
                                color: textColor
                            }
                        ]}
                        value={equation2D}
                        onChangeText={setEquation2D}
                        placeholder="Enter function (e.g., x^2)"
                        placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                    />
                    <TouchableOpacity
                        style={[styles.visualizeButton, { backgroundColor: tintColor }]}
                        onPress={handleVisualize2D}
                    >
                        <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Plot</ThemedText>
                    </TouchableOpacity>
                </View>
            );
        } else if (graphType === 'parametric') {
            return (
                <View>
                    <View style={styles.paramInputContainer}>
                        <ThemedText>x(t) = </ThemedText>
                        <TextInput
                            style={[
                                styles.equationInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={paramX}
                            onChangeText={setParamX}
                            placeholder="cos(t)"
                            placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                        />
                    </View>
                    <View style={styles.paramInputContainer}>
                        <ThemedText>y(t) = </ThemedText>
                        <TextInput
                            style={[
                                styles.equationInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={paramY}
                            onChangeText={setParamY}
                            placeholder="sin(t)"
                            placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                        />
                    </View>
                    <View style={styles.rangeInputGroup}>
                        <ThemedText>t: </ThemedText>
                        <TextInput
                            style={[
                                styles.rangeInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={tRange.min.toString()}
                            onChangeText={(text) => setTRange({...tRange, min: Number(text) || 0})}
                            keyboardType="numeric"
                        />
                        <ThemedText> to </ThemedText>
                        <TextInput
                            style={[
                                styles.rangeInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={tRange.max.toString()}
                            onChangeText={(text) => setTRange({...tRange, max: Number(text) || 0})}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.visualizeButton, { backgroundColor: tintColor, marginVertical: 10 }]}
                        onPress={handleVisualize2D}
                    >
                        <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Plot Parametric</ThemedText>
                    </TouchableOpacity>
                </View>
            );
        } else {
            return (
                <View>
                    <View style={styles.paramInputContainer}>
                        <ThemedText>r(θ) = </ThemedText>
                        <TextInput
                            style={[
                                styles.equationInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={polarR}
                            onChangeText={setPolarR}
                            placeholder="cos(2*theta)"
                            placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                        />
                    </View>
                    <View style={styles.rangeInputGroup}>
                        <ThemedText>θ: </ThemedText>
                        <TextInput
                            style={[
                                styles.rangeInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={thetaRange.min.toString()}
                            onChangeText={(text) => setThetaRange({...thetaRange, min: Number(text) || 0})}
                            keyboardType="numeric"
                        />
                        <ThemedText> to </ThemedText>
                        <TextInput
                            style={[
                                styles.rangeInput,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            value={thetaRange.max.toString()}
                            onChangeText={(text) => setThetaRange({...thetaRange, max: Number(text) || 0})}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.visualizeButton, { backgroundColor: tintColor, marginVertical: 10 }]}
                        onPress={handleVisualize2D}
                    >
                        <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Plot Polar</ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }
    };

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor }}>
            <ScrollView style={sharedStyles.scrollView}>
                <ThemedView style={styles.headerContainer}>
                    <ThemedText type="title" style={sharedStyles.title}>Math Visualizer</ThemedText>
                    <ThemedText>Visualize mathematical functions and equations</ThemedText>
                </ThemedView>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            { backgroundColor: showGraph ? tintColor : cardBackground }
                        ]}
                        onPress={() => {
                            setShowGraph(true);
                            setShow3D(false);
                        }}
                    >
                        <IconSymbol name="function" size={18} color={showGraph ? '#fff' : textColor} />
                        <ThemedText style={[styles.tabText, showGraph && { color: '#fff', fontWeight: 'bold' }]}>2D Graph</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            { backgroundColor: show3D ? tintColor : cardBackground }
                        ]}
                        onPress={() => {
                            setShowGraph(false);
                            setShow3D(true);
                        }}
                    >
                        <IconSymbol name="cube" size={18} color={show3D ? '#fff' : textColor} />
                        <ThemedText style={[styles.tabText, show3D && { color: '#fff', fontWeight: 'bold' }]}>3D Graph</ThemedText>
                    </TouchableOpacity>
                </View>

                {showGraph && (
                    <ThemedView style={[styles.sectionContainer, { backgroundColor: cardBackground }]}>
                        <ThemedText type="subtitle">2D Function Visualizer</ThemedText>

                        {render2DGraphOptions()}
                        {render2DInputFields()}

                        {graphType === 'cartesian' && (
                            <View style={styles.rangeContainer}>
                                <View style={styles.rangeInputGroup}>
                                    <ThemedText>X: </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.rangeInput,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={xRange.min.toString()}
                                        onChangeText={(text) => setXRange({...xRange, min: Number(text) || 0})}
                                        keyboardType="numeric"
                                    />
                                    <ThemedText> to </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.rangeInput,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={xRange.max.toString()}
                                        onChangeText={(text) => setXRange({...xRange, max: Number(text) || 0})}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.rangeInputGroup}>
                                    <ThemedText>Y: </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.rangeInput,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={yRange.min.toString()}
                                        onChangeText={(text) => setYRange({...yRange, min: Number(text) || 0})}
                                        keyboardType="numeric"
                                    />
                                    <ThemedText> to </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.rangeInput,
                                            {
                                                backgroundColor: inputBackground,
                                                borderColor: inputBorder,
                                                color: textColor
                                            }
                                        ]}
                                        value={yRange.max.toString()}
                                        onChangeText={(text) => setYRange({...yRange, max: Number(text) || 0})}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        )}

                        <MathGraph
                            equation={equation2D}
                            minX={xRange.min}
                            maxX={xRange.max}
                            minY={yRange.min}
                            maxY={yRange.max}
                            graphType={graphType}
                            paramX={paramX}
                            paramY={paramY}
                            polarR={polarR}
                            tMin={tRange.min}
                            tMax={tRange.max}
                            thetaMin={thetaRange.min}
                            thetaMax={thetaRange.max}
                        />
                    </ThemedView>
                )}

                {show3D && (
                    <ThemedView style={[styles.sectionContainer, { backgroundColor: cardBackground }]}>
                        <ThemedText type="subtitle">3D Function Visualizer</ThemedText>

                        <View style={styles.inputContainer}>
                            <ThemedText>f(x,y) = </ThemedText>
                            <TextInput
                                style={[
                                    styles.equationInput,
                                    {
                                        backgroundColor: inputBackground,
                                        borderColor: inputBorder,
                                        color: textColor
                                    }
                                ]}
                                value={equation3D}
                                onChangeText={setEquation3D}
                                placeholder="Enter function (e.g., x^2 + y^2)"
                                placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                            />
                            <TouchableOpacity
                                style={[styles.visualizeButton, { backgroundColor: tintColor }]}
                                onPress={handleVisualize3D}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Plot</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.rangeContainer}>
                            <View style={styles.rangeInputGroup}>
                                <ThemedText>X: </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={xRange.min.toString()}
                                    onChangeText={(text) => setXRange({...xRange, min: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                                <ThemedText> to </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={xRange.max.toString()}
                                    onChangeText={(text) => setXRange({...xRange, max: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.rangeInputGroup}>
                                <ThemedText>Y: </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={yRange.min.toString()}
                                    onChangeText={(text) => setYRange({...yRange, min: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                                <ThemedText> to </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={yRange.max.toString()}
                                    onChangeText={(text) => setYRange({...yRange, max: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.rangeInputGroup}>
                                <ThemedText>Z: </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={zRange.min.toString()}
                                    onChangeText={(text) => setZRange({...zRange, min: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                                <ThemedText> to </ThemedText>
                                <TextInput
                                    style={[
                                        styles.rangeInput,
                                        {
                                            backgroundColor: inputBackground,
                                            borderColor: inputBorder,
                                            color: textColor
                                        }
                                    ]}
                                    value={zRange.max.toString()}
                                    onChangeText={(text) => setZRange({...zRange, max: Number(text) || 0})}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Math3DVisualizer
                            function={equation3D}
                            xRange={[xRange.min, xRange.max]}
                            yRange={[yRange.min, yRange.max]}
                            zRange={[zRange.min, zRange.max]}
                        />
                    </ThemedView>
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
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    tabText: {
        marginLeft: 6,
    },
    sectionContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    graphTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    graphTypeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginHorizontal: 4,
        borderRadius: 6,
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    paramInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    equationInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        marginHorizontal: 8,
    },
    visualizeButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 6,
        minHeight: 44,
        minWidth: 44
    },
    rangeContainer: {
        marginVertical: 10,
    },
    rangeInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    rangeInput: {
        width: 60,
        height: 44,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        textAlign: 'center',
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
