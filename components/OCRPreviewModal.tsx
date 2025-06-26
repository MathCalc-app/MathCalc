import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import MathWebView from '@/components/ui/MathWebView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { cacheImageProcess } from '@/utils/mathProcessor';

interface OCRReviewData {
    status: 'review' | 'accepted';
    latex: string;
    confidence: number;
    syntax_ok: boolean;
}

interface OCRPreviewModalProps {
    visible: boolean;
    onAccept: (latex: string) => void;
    onCancel: () => void;
    imageHash?: string;
}

const OCRPreviewModal = ({ visible, onAccept, onCancel, imageHash }: OCRPreviewModalProps) => {
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState<OCRReviewData | null>(null);
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const cardBackground = effectiveTheme === 'light' ? '#f5f5f5' : '#1c1c1e';
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');
    const borderColor = effectiveTheme === 'light' ? '#ddd' : '#444';

    useEffect(() => {
        if (visible) {
            loadReviewData();
        }
    }, [visible]);

    const loadReviewData = async () => {
        try {
            setLoading(true);
            const dataString = await AsyncStorage.getItem('ocr_review_data');
            if (dataString) {
                const data = JSON.parse(dataString);
                setReviewData(data);
            } else {
                console.error('No OCR review data found');
            }
        } catch (error) {
            console.error('Error loading OCR review data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (reviewData && reviewData.latex) {
            if (imageHash) {
                try {
                    await cacheImageProcess(imageHash, reviewData.latex);
                } catch (error) {
                    console.error('Error caching accepted OCR result:', error);
                }
            }
            onAccept(reviewData.latex);
        } else {
            onCancel();
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return '#27AE60';
        if (confidence >= 0.7) return '#F2C94C';
        return '#E74C3C';
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.centeredView}>
                <ThemedView style={[styles.modalView, { backgroundColor: cardBackground }]}>
                    <ThemedText type="subtitle" style={styles.modalTitle}>
                        OCR Result Review
                    </ThemedText>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={tintColor} />
                            <ThemedText style={styles.loadingText}>Loading OCR result...</ThemedText>
                        </View>
                    ) : reviewData ? (
                        <>
                            <View style={styles.previewContainer}>
                                <ThemedText type="defaultSemiBold">Preview:</ThemedText>
                                <View style={[styles.latexPreview, { backgroundColor, borderColor }]}>
                                    <MathWebView
                                        latexExpression={reviewData.latex}
                                    />
                                </View>
                            </View>

                            <View style={styles.metadataContainer}>
                                <View style={styles.metadataRow}>
                                    <ThemedText style={styles.metadataLabel}>Confidence:</ThemedText>
                                    <View style={styles.confidenceContainer}>
                                        <Text style={[
                                            styles.confidenceValue,
                                            { color: getConfidenceColor(reviewData.confidence) }
                                        ]}>
                                            {Math.round(reviewData.confidence * 100)}%
                                        </Text>
                                        <View style={[
                                            styles.confidenceMeter,
                                            { backgroundColor: effectiveTheme === 'light' ? '#eee' : '#333' }
                                        ]}>
                                            <View
                                                style={[
                                                    styles.confidenceFill,
                                                    {
                                                        width: `${Math.round(reviewData.confidence * 100)}%`,
                                                        backgroundColor: getConfidenceColor(reviewData.confidence)
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.metadataRow}>
                                    <ThemedText style={styles.metadataLabel}>Syntax:</ThemedText>
                                    <View style={styles.syntaxContainer}>
                                        <IconSymbol
                                            name={reviewData.syntax_ok ? "checkmark.circle.fill" : "xmark.circle.fill"}
                                            size={20}
                                            color={reviewData.syntax_ok ? "#27AE60" : "#E74C3C"}
                                        />
                                        <ThemedText style={styles.syntaxLabel}>
                                            {reviewData.syntax_ok ? "Valid" : "Invalid"}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            <ThemedText style={styles.rawLatexLabel}>LaTeX Expression:</ThemedText>
                            <View style={[styles.rawLatexContainer, { backgroundColor, borderColor }]}>
                                <ThemedText style={styles.rawLatex} numberOfLines={3}>
                                    {reviewData.latex}
                                </ThemedText>
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonCancel, { borderColor }]}
                                    onPress={onCancel}
                                >
                                    <ThemedText>Reject</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonAccept, { backgroundColor: tintColor }]}
                                    onPress={handleAccept}
                                >
                                    <Text style={styles.acceptButtonText}>Accept</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.errorContainer}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#E74C3C" />
                            <ThemedText style={styles.errorText}>
                                No OCR data available for review
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: tintColor, marginTop: 20 }]}
                                onPress={onCancel}
                            >
                                <Text style={styles.acceptButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ThemedView>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: width * 0.9,
        maxWidth: 500,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        marginBottom: 16,
        textAlign: 'center',
    },
    previewContainer: {
        marginBottom: 16,
    },
    latexPreview: {
        height: 100,
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 8,
        overflow: 'hidden',
    },
    metadataContainer: {
        marginBottom: 16,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    metadataLabel: {
        fontWeight: '600',
        width: 100,
    },
    confidenceContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceValue: {
        fontWeight: 'bold',
        marginRight: 8,
        width: 50,
    },
    confidenceMeter: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
    },
    syntaxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syntaxLabel: {
        marginLeft: 8,
    },
    rawLatexLabel: {
        fontWeight: '600',
        marginBottom: 8,
    },
    rawLatexContainer: {
        padding: 10,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
    },
    rawLatex: {
        fontFamily: 'monospace',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexBasis: '48%',
    },
    buttonCancel: {
        borderWidth: 1,
    },
    buttonAccept: {
        elevation: 2,
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        padding: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        marginTop: 10,
        textAlign: 'center',
    },
});

export default OCRPreviewModal;
