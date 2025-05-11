import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';

interface MathGraphProps {
    equation: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

const MathGraph = ({ equation, minX = -10, maxX = 10, minY = -10, maxY = 10 }: MathGraphProps) => {
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const gridColor = effectiveTheme === 'dark' ? '#444444' : '#dddddd';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/mathjs@11.8.0/lib/browser/math.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: ${backgroundColor};
            color: ${textColor};
          }
        </style>
      </head>
      <body>
        <canvas id="myChart" width="100%" height="100%"></canvas>
        <script>
          const equation = "${equation}";
          const parser = math.parse(equation);
          const compiled = parser.compile();
          
          const points = [];
          for(let x = ${minX}; x <= ${maxX}; x += 0.1) {
            try {
              const y = compiled.evaluate({x: x});
              points.push({x, y});
            } catch(e) {
            }
          }
          
          const ctx = document.getElementById('myChart');
          new Chart(ctx, {
            type: 'scatter',
            data: {
              datasets: [{
                label: equation,
                data: points,
                showLine: true,
                borderColor: '${tintColor}',
                backgroundColor: '${effectiveTheme === 'dark' ? 'rgba(54, 162, 235, 0.3)' : 'rgba(54, 162, 235, 0.2)'}'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  min: ${minX},
                  max: ${maxX},
                  grid: {
                    color: '${gridColor}'
                  },
                  ticks: {
                    color: '${textColor}'
                  }
                },
                y: {
                  min: ${minY},
                  max: ${maxY},
                  grid: {
                    color: '${gridColor}'
                  },
                  ticks: {
                    color: '${textColor}'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: '${textColor}'
                  }
                }
              }
            }
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
                originWhitelist={['*']}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        marginVertical: 10,
    },
    webview: {
        flex: 1,
    },
});

export default MathGraph;
