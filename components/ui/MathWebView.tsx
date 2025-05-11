import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';

interface MathWebViewProps {
    latexExpression: string;
}

const MathWebView: React.FC<MathWebViewProps> = ({ latexExpression = "" }) => {
    const safeLatexExpression = latexExpression ? String(latexExpression) : "";
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" integrity="sha384-cMkvdD8LoxVzGF/RPUKAcvmm49FQ0oxwDF3BGKtDXcEc+T1b2N+teh/OJfpU0jr6" crossorigin="anonymous"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            display: flex; 
            justify-content: center; 
            margin: 0; 
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
          }
          #formula { 
            font-size: 1.2em;
            max-width: 100%;
            overflow-x: auto;
            color: ${textColor};
          }
          .katex { color: ${textColor}; }
        </style>
      </head>
      <body>
        <div id="formula"></div>
        <script>
          document.addEventListener("DOMContentLoaded", function() {
            katex.render(\`${safeLatexExpression.replace(/\\/g, '\\\\')}\`, document.getElementById("formula"), {
              throwOnError: false,
              displayMode: true
            });
          });
        </script>
      </body>
    </html>
  `;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <WebView
                source={{ html: htmlContent }}
                style={[styles.webview, { backgroundColor }]}
                scrollEnabled={false}
                originWhitelist={['*']}
                javaScriptEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        width: '100%',
        marginVertical: 10,
    },
    webview: {
        flex: 1,
    },
});

export default MathWebView;
