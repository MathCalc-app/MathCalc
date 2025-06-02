import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';

interface Math3DVisualizerProps {
    function: string;
    xRange?: [number, number];
    yRange?: [number, number];
    zRange?: [number, number];
}

const Math3DVisualizer = ({
                              function: mathFunction,
                              xRange = [-5, 5],
                              yRange = [-5, 5],
                              zRange = [-10, 10]
                          }: Math3DVisualizerProps) => {
    const { effectiveTheme } = useTheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const gridColor = effectiveTheme === 'dark' ? '#444444' : '#cccccc';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
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
        <div id="graph" style="width:100%;height:100%;"></div>
        <script>
          try {
            const mathFunction = \`${mathFunction}\`;
            const expr = math.compile(mathFunction);
            
            const xValues = [];
            const yValues = [];
            const zValues = [];
            
            const xMin = ${xRange[0]};
            const xMax = ${xRange[1]};
            const yMin = ${yRange[0]};
            const yMax = ${yRange[1]};
            
            const xStep = (xMax - xMin) / 50;
            const yStep = (yMax - yMin) / 50;
            
            for (let x = xMin; x <= xMax; x += xStep) {
              const zRow = [];
              const xRow = [];
              const yRow = [];
              
              for (let y = yMin; y <= yMax; y += yStep) {
                try {
                  const z = expr.evaluate({ x, y });
                  if (z >= ${zRange[0]} && z <= ${zRange[1]}) {
                    zRow.push(z);
                    xRow.push(x);
                    yRow.push(y);
                  } else {
                    zRow.push(null);
                    xRow.push(x);
                    yRow.push(y);
                  }
                } catch (e) {
                  zRow.push(null);
                  xRow.push(x);
                  yRow.push(y);
                }
              }
              
              zValues.push(zRow);
              xValues.push(xRow);
              yValues.push(yRow);
            }
            
            const data = [{
              type: 'surface',
              x: xValues,
              y: yValues,
              z: zValues,
              colorscale: '${effectiveTheme === 'dark' ? 'Viridis' : 'Blues'}',
              contours: {
                z: {
                  show: true,
                  usecolormap: true,
                  highlightcolor: "${tintColor}",
                  project: {z: true}
                }
              }
            }];
            
            const layout = {
              title: {
                text: mathFunction,
                font: {
                  color: '${textColor}'
                }
              },
              autosize: true,
              paper_bgcolor: '${backgroundColor}',
              plot_bgcolor: '${backgroundColor}',
              margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 30,
                pad: 0
              },
              scene: {
                xaxis: {
                  range: [${xRange[0]}, ${xRange[1]}],
                  gridcolor: '${gridColor}',
                  zerolinecolor: '${gridColor}',
                  showbackground: true,
                  backgroundcolor: '${backgroundColor}',
                  title: {
                    font: {
                      color: '${textColor}'
                    }
                  },
                  tickfont: {
                    color: '${textColor}'
                  }
                },
                yaxis: {
                  range: [${yRange[0]}, ${yRange[1]}],
                  gridcolor: '${gridColor}',
                  zerolinecolor: '${gridColor}',
                  showbackground: true,
                  backgroundcolor: '${backgroundColor}',
                  title: {
                    font: {
                      color: '${textColor}'
                    }
                  },
                  tickfont: {
                    color: '${textColor}'
                  }
                },
                zaxis: {
                  range: [${zRange[0]}, ${zRange[1]}],
                  gridcolor: '${gridColor}',
                  zerolinecolor: '${gridColor}',
                  showbackground: true,
                  backgroundcolor: '${backgroundColor}',
                  title: {
                    font: {
                      color: '${textColor}'
                    }
                  },
                  tickfont: {
                    color: '${textColor}'
                  }
                },
                aspectratio: {x: 1, y: 1, z: 0.7}
              }
            };
            
            Plotly.newPlot('graph', data, layout, {responsive: true});
          } catch (err) {
            document.getElementById('graph').innerHTML = 'Error: ' + err.message;
          }
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
                javaScriptEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 400,
        width: '100%',
        marginVertical: 10,
    },
    webview: {
        flex: 1,
    },
});

export default Math3DVisualizer;
