import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import MathWebView from '@/components/ui/MathWebView';

interface MixedLatexTextProps {
    text?: string;
    style?: any;
}

const MixedLatexText: React.FC<MixedLatexTextProps> = ({ text = "", style }) => {
    if (!text) {
        return <ThemedText style={style}></ThemedText>;
    }

    const renderedContent = useMemo(() => {
        try {
            const latexRegexPattern =
                /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\})/g;

            const safeText = String(text || "");

            const segments: { isLatex: boolean; content: string }[] = [];
            let lastIndex = 0;

            let match;
            while ((match = latexRegexPattern.exec(safeText)) !== null) {
                const matchedText = match[0];
                const startIndex = match.index;
                const endIndex = startIndex + matchedText.length;

                if (startIndex > lastIndex) {
                    segments.push({
                        isLatex: false,
                        content: safeText.substring(lastIndex, startIndex)
                    });
                }

                let latexContent = matchedText;

                if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
                    latexContent = matchedText.slice(2, -2);
                } else if (matchedText.startsWith('$') && matchedText.endsWith('$')) {
                    latexContent = matchedText.slice(1, -1);
                } else if (matchedText.startsWith('\\(') && matchedText.endsWith('\\)')) {
                    latexContent = matchedText.slice(2, -2);
                } else if (matchedText.startsWith('\\[') && matchedText.endsWith('\\]')) {
                    latexContent = matchedText.slice(2, -2);
                }

                segments.push({
                    isLatex: true,
                    content: latexContent
                });

                lastIndex = endIndex;
            }

            if (lastIndex < safeText.length) {
                segments.push({
                    isLatex: false,
                    content: safeText.substring(lastIndex)
                });
            }

            if (segments.length === 0) {
                return [
                    <ThemedText key="original" style={style}>
                        {safeText}
                    </ThemedText>
                ];
            }

            return segments.map((segment, index) => {
                if (!segment.isLatex) {
                    return (
                        <ThemedText key={`text-${index}`} style={style}>
                            {segment.content}
                        </ThemedText>
                    );
                } else {
                    return (
                        <View key={`latex-${index}`} style={styles.latexContainer}>
                            <MathWebView latexExpression={segment.content} />
                        </View>
                    );
                }
            });
        } catch (error) {
            console.error('Error processing LaTeX content:', error);
            return [
                <ThemedText key="error" style={style}>
                    {String(text || "")}
                </ThemedText>
            ];
        }
    }, [text, style]);

    return <View style={styles.container}>{renderedContent}</View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    latexContainer: {
        marginVertical: 6,
        alignSelf: 'flex-start',
        width: '100%',
    },
});

export default MixedLatexText;
