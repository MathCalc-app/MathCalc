import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import MathWebView from './ui/MathWebView';

type Formula = {
    id: string;
    name: string;
    category: string;
    latex: string;
    description: string;
    example?: string;
};

const formulas: Formula[] = [
    {
        id: '1',
        name: 'Pythagorean Theorem',
        category: 'Geometry',
        latex: 'a^2 + b^2 = c^2',
        description: 'In a right triangle, the square of the length of the hypotenuse equals the sum of squares of the other two sides.',
        example: 'If a=3 and b=4, then c=5'
    },
    {
        id: '2',
        name: 'Quadratic Formula',
        category: 'Algebra',
        latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        description: 'The solution to a quadratic equation ax² + bx + c = 0.',
        example: 'For x²-5x+6=0, x=2 or x=3'
    },
    {
        id: '3',
        name: 'Area of a Circle',
        category: 'Geometry',
        latex: 'A = \\pi r^2',
        description: 'The area of a circle is pi times the square of its radius.',
        example: 'A circle with radius 2 has area π×2²=4π≈12.57'
    },
    {
        id: '4',
        name: 'Derivative Power Rule',
        category: 'Calculus',
        latex: '\\frac{d}{dx}(x^n) = nx^{n-1}',
        description: 'The derivative of x raised to a power equals the power times x raised to the power minus 1.',
        example: 'The derivative of x³ is 3x²'
    },
    {
        id: '5',
        name: 'Exponential Growth/Decay',
        category: 'Calculus',
        latex: 'y = y_0 e^{kt}',
        description: 'Models exponential growth (k>0) or decay (k<0) of a quantity over time.',
        example: 'Radioactive decay, population growth'
    }
];

const categories = ['All', 'Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics'];

type FormulaLibraryProps = {
    onUseFormula?: (formula: Formula) => void;
    onClose?: () => void;
};

export default function FormulaLibrary({ onUseFormula, onClose }: FormulaLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

    const { effectiveTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    const inputBackground = effectiveTheme === 'light'
        ? '#ffffff'
        : '#252728';

    const inputBorder = effectiveTheme === 'light'
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(255,255,255,0.1)';

    const cardBackground = effectiveTheme === 'light'
        ? '#f5f5f5'
        : '#1c1c1e';

    const filteredFormulas = formulas.filter(formula => {
        const matchesSearch = formula.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formula.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || formula.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleUseFormula = (formula: Formula) => {
        if (onUseFormula) {
            onUseFormula(formula);
        }
        setSelectedFormula(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="subtitle">Formula Reference</ThemedText>
                {onClose && (
                    <TouchableOpacity onPress={onClose}>
                        <IconSymbol name="xmark.circle" size={24} color={textColor} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={[
                        styles.searchInput,
                        {
                            backgroundColor: inputBackground,
                            borderColor: inputBorder,
                            color: textColor
                        }
                    ]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search formulas..."
                    placeholderTextColor={effectiveTheme === 'dark' ? '#888' : '#aaa'}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {categories.map(category => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            selectedCategory === category && { backgroundColor: tintColor }
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <ThemedText
                            style={[
                                styles.categoryText,
                                selectedCategory === category && { color: '#fff' }
                            ]}
                        >
                            {category}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {selectedFormula ? (
                <View style={[styles.formulaDetail, { backgroundColor: cardBackground }]}>
                    <View style={styles.formulaDetailHeader}>
                        <ThemedText type="subtitle">{selectedFormula.name}</ThemedText>
                        <TouchableOpacity onPress={() => setSelectedFormula(null)}>
                            <IconSymbol name="xmark.circle.fill" size={24} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.formulaCategory}>{selectedFormula.category}</ThemedText>

                    <MathWebView latexExpression={selectedFormula.latex} />

                    <ThemedText style={styles.formulaDescription}>{selectedFormula.description}</ThemedText>

                    {selectedFormula.example && (
                        <ThemedText style={styles.formulaExample}>Example: {selectedFormula.example}</ThemedText>
                    )}

                    <TouchableOpacity
                        style={[styles.useFormulaButton, { backgroundColor: tintColor }]}
                        onPress={() => handleUseFormula(selectedFormula)}
                    >
                        <ThemedText style={styles.useFormulaText}>Use This Formula</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.formulaList}>
                    {filteredFormulas.map(formula => (
                        <TouchableOpacity
                            key={formula.id}
                            style={[styles.formulaItem, { backgroundColor: cardBackground }]}
                            onPress={() => setSelectedFormula(formula)}
                        >
                            <ThemedText style={styles.formulaName}>{formula.name}</ThemedText>
                            <ThemedText style={styles.formulaCategory}>{formula.category}</ThemedText>
                            <MathWebView latexExpression={formula.latex} />
                        </TouchableOpacity>
                    ))}

                    {filteredFormulas.length === 0 && (
                        <View style={styles.emptyState}>
                            <IconSymbol name="doc.text" size={40} color={textColor} style={{ opacity: 0.5 }} />
                            <ThemedText style={styles.emptyText}>No formulas found.</ThemedText>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchContainer: {
        marginVertical: 10,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    categoriesContainer: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    categoryText: {
        fontSize: 14,
    },
    formulaList: {
        marginTop: 10,
        maxHeight: 300,
    },
    formulaItem: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    formulaName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    formulaCategory: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 5,
    },
    formulaDetail: {
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    formulaDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    formulaDescription: {
        marginTop: 10,
        lineHeight: 20,
    },
    formulaExample: {
        marginTop: 10,
        fontStyle: 'italic',
    },
    useFormulaButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    useFormulaText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        opacity: 0.7,
    }
});
