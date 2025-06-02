
import React from 'react';
import {WebView} from 'react-native-webview';
import {Dimensions, StyleSheet, View} from 'react-native';
import {useThemeColor} from '@/hooks/useThemeColor';
import {useTheme} from '@/contexts/ThemeContext';

interface MathGraphProps {
    equation: string,
    minX?: number,
    maxX?: number,
    minY?: number,
    maxY?: number,
    graphType?: "cartesian" | "parametric" | "polar",
    paramX?: string,
    paramY?: string,
    polarR?: string,
    tMin?: number,
    tMax?: number,
    thetaMin?: number,
    thetaMax?: number
}

const MathGraph = ({
                       equation,
                       minX = -10,
                       maxX = 10,
                       minY = -10,
                       maxY = 10,
                       graphType = "cartesian",
                       paramX = "cos(t)",
                       paramY = "sin(t)",
                       polarR = "cos(2*theta)",
                       tMin = 0,
                       tMax = 6.28,
                       thetaMin = 0,
                       thetaMax = 6.28
                   }: MathGraphProps) => {
    const {effectiveTheme} = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const gridColor = effectiveTheme === 'dark' ? '#444444' : '#dddddd';

    let graphScript = '';

    if (graphType === 'cartesian') {
        graphScript = `
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
            options: graphOptions
          });
        `;
    } else if (graphType === 'parametric') {
        graphScript = `
          const paramXEquation = "${paramX}";
          const paramYEquation = "${paramY}";
          const paramXCompiled = math.parse(paramXEquation).compile();
          const paramYCompiled = math.parse(paramYEquation).compile();
          
          const points = [];
          const step = (${tMax} - ${tMin}) / 200;
          for(let t = ${tMin}; t <= ${tMax}; t += step) {
            try {
              const x = paramXCompiled.evaluate({t: t});
              const y = paramYCompiled.evaluate({t: t});
              points.push({x, y});
            } catch(e) {
            }
          }
          
          new Chart(ctx, {
            type: 'scatter',
            data: {
              datasets: [{
                label: 'x = ${paramX}, y = ${paramY}',
                data: points,
                showLine: true,
                borderColor: '${tintColor}',
                backgroundColor: '${effectiveTheme === 'dark' ? 'rgba(54, 162, 235, 0.3)' : 'rgba(54, 162, 235, 0.2)'}'
              }]
            },
            options: graphOptions
          });
        `;
    } else if (graphType === 'polar') {
        graphScript = `
          const polarREquation = "${polarR}";
          const polarRCompiled = math.parse(polarREquation).compile();
          
          const points = [];
          const step = (${thetaMax} - ${thetaMin}) / 200;
          for(let theta = ${thetaMin}; theta <= ${thetaMax}; theta += step) {
            try {
              const r = polarRCompiled.evaluate({theta: theta});
              const x = r * Math.cos(theta);
              const y = r * Math.sin(theta);
              points.push({x, y});
            } catch(e) {
            }
          }
          
          new Chart(ctx, {
            type: 'scatter',
            data: {
              datasets: [{
                label: 'r = ${polarR}',
                data: points,
                showLine: true,
                borderColor: '${tintColor}',
                backgroundColor: '${effectiveTheme === 'dark' ? 'rgba(54, 162, 235, 0.3)' : 'rgba(54, 162, 235, 0.2)'}'
              }]
            },
            options: graphOptions
          });
        `;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta content="width=device-width, initial-scale=1.0">
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
          const ctx = document.getElementById('myChart');
          
          const graphOptions = {
            responsive: true,
            maintainAspectRatio: true,
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
          };
          
          ${graphScript}
        </script>
      </body>
    </html>
  `;

    return (
        <View style={[styles.container, {backgroundColor}]}>
            <WebView
                source={{html: htmlContent}}
                style={[styles.webview, {backgroundColor}]}
                originWhitelist={['*']}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: Math.max(300, Dimensions.get('window').height * 0.4),
        width: '100%',
        marginVertical: 10,
    },
    webview: {
        flex: 1,
    },
});

export default MathGraph;
