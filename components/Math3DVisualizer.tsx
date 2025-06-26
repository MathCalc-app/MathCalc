import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
    const accentColor = effectiveTheme === 'dark' ? '#6E8BFF' : '#4B69E7';
    const gridColor = effectiveTheme === 'dark' ? '#444444' : '#cccccc';
    const [isLoading, setIsLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleWebViewLoad = () => {
        setIsLoading(false);
    };

    const handleWebViewError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        setErrorMessage(nativeEvent.description || 'Failed to load visualization');
        setIsLoading(false);
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'loaded') {
                setIsLoading(false);
            } else if (data.type === 'error') {
                setErrorMessage(data.message);
                setIsLoading(false);
            }
        } catch (e) {
            console.error('Error parsing message from WebView:', e);
        }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/mathjs@11.8.0/lib/browser/math.min.js"></script>
        <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: ${backgroundColor};
            color: ${textColor};
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          
          #graph {
            width: 100%;
            height: 100vh;
            touch-action: manipulation;
          }
          
          #info {
            position: absolute;
            top: 10px;
            left: 10px;
            color: ${textColor};
            font-size: 14px;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 8px;
            border-radius: 8px;
            opacity: 0.9;
            z-index: 1000;
          }
          
          #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${textColor};
            font-size: 16px;
            text-align: center;
            z-index: 1000;
          }
          
          .js-plotly-plot .plotly .modebar {
            right: 10px;
            top: 10px;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          #graph {
            animation: fadeIn 0.5s ease-in-out;
          }
        </style>
      </head>
      <body>
        <div id="graph"></div>
        <div id="info">f(x,y) = ${mathFunction}</div>
        <div id="loading">Generating 3D visualization...</div>
        <script>
          try {
            function sendToReactNative(message) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
              }
            }
            
            window.addEventListener('load', function() {
              setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                sendToReactNative({ type: 'loaded' });
              }, 500);
            });
            
            const mathFunction = \`${mathFunction}\`;
            const expr = math.compile(mathFunction);
            
            const xMin = ${xRange[0]};
            const xMax = ${xRange[1]};
            const yMin = ${yRange[0]};
            const yMax = ${yRange[1]};
            const zMin = ${zRange[0]};
            const zMax = ${zRange[1]};
            
            const resolution = 50;
            const xStep = (xMax - xMin) / resolution;
            const yStep = (yMax - yMin) / resolution;
            
            const x = [];
            const y = [];
            const z = [];
            
            for (let i = 0; i <= resolution; i++) {
              const xVal = xMin + i * xStep;
              const zRow = [];
              
              for (let j = 0; j <= resolution; j++) {
                const yVal = yMin + j * yStep;
                
                if (i === 0) {
                  y.push(yVal);
                }
                
                try {
                  const zVal = expr.evaluate({ x: xVal, y: yVal });
                  if (!isNaN(zVal) && isFinite(zVal) && zVal >= zMin && zVal <= zMax) {
                    zRow.push(zVal);
                  } else {
                    zRow.push(null);
                  }
                } catch (e) {
                  zRow.push(null);
                }
              }
              
              x.push(xVal);
              z.push(zRow);
            }
            
            const colorscale = '${effectiveTheme}' === 'dark' 
              ? [
                  [0, '#6E8BFF'],
                  [1, '#FF8F66']
                ]
              : [
                  [0, '#4B69E7'],
                  [1, '#FF5722']
                ];
            
            const data = [{
              type: 'surface',
              x: x,
              y: y,
              z: z,
              colorscale: colorscale,
              lighting: {
                ambient: 0.6,
                diffuse: 0.8,
                fresnel: 0.5,
                roughness: 0.5,
                specular: 0.8
              },
              contours: {
                z: {
                  show: true,
                  usecolormap: true,
                  project: {z: true}
                }
              },
              opacity: 0.9,
              hoverinfo: 'x+y+z',
              showscale: false
            }];
            
            const layout = {
              title: '',
              autosize: true,
              margin: {
                l: 10,
                r: 10,
                b: 10,
                t: 10,
                pad: 0
              },
              paper_bgcolor: '${backgroundColor}',
              plot_bgcolor: '${backgroundColor}',
              scene: {
                xaxis: {
                  title: 'x',
                  titlefont: { color: '${textColor}' },
                  tickfont: { color: '${textColor}' },
                  backgroundcolor: '${backgroundColor}',
                  gridcolor: '${gridColor}',
                  showbackground: true,
                  zerolinecolor: '${textColor}',
                  range: [xMin, xMax]
                },
                yaxis: {
                  title: 'y',
                  titlefont: { color: '${textColor}' },
                  tickfont: { color: '${textColor}' },
                  backgroundcolor: '${backgroundColor}',
                  gridcolor: '${gridColor}',
                  showbackground: true,
                  zerolinecolor: '${textColor}',
                  range: [yMin, yMax]
                },
                zaxis: {
                  title: 'z',
                  titlefont: { color: '${textColor}' },
                  tickfont: { color: '${textColor}' },
                  backgroundcolor: '${backgroundColor}',
                  gridcolor: '${gridColor}',
                  showbackground: true,
                  zerolinecolor: '${textColor}',
                  range: [zMin, zMax]
                },
                camera: {
                  eye: {x: 1.5, y: 1.5, z: 1.5}
                },
                aspectratio: {x: 1, y: 1, z: 1}
              }
            };
            
            const config = {
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'],
              modeBarButtonsToAdd: [{
                name: 'Reset camera',
                icon: Plotly.Icons.home,
                click: function(gd) {
                  Plotly.relayout(gd, {
                    'scene.camera.eye': {x: 1.5, y: 1.5, z: 1.5}
                  });
                }
              }]
            };
            
            Plotly.newPlot('graph', data, layout, config).then(() => {
              document.getElementById('loading').style.display = 'none';
              sendToReactNative({ type: 'loaded' });
              
              let frameCount = 0;
              const rotationFrames = 40;
              
              const rotate = () => {
                if (frameCount < rotationFrames) {
                  const camera = document.getElementById('graph').layout.scene.camera;
                  const eye = camera.eye;
                  
                  const theta = Math.atan2(eye.y, eye.x);
                  const r = Math.sqrt(eye.x * eye.x + eye.y * eye.y);
                  const newTheta = theta + 0.05;
                  
                  Plotly.relayout('graph', {
                    'scene.camera.eye.x': r * Math.cos(newTheta),
                    'scene.camera.eye.y': r * Math.sin(newTheta)
                  });
                  
                  frameCount++;
                  requestAnimationFrame(rotate);
                }
              };
              
              setTimeout(rotate, 500);
            }).catch(err => {
              document.getElementById('loading').style.display = 'none';
              sendToReactNative({ type: 'error', message: err.message });
            });
            
            window.addEventListener('resize', () => {
              Plotly.Plots.resize(document.getElementById('graph'));
            });
            
          } catch (err) {
            document.getElementById('graph').innerHTML = 'Error: ' + err.message;
            document.getElementById('loading').style.display = 'none';
            sendToReactNative({ type: 'error', message: err.message });
          }
        </script>
      </body>
    </html>
  `;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <Text style={[styles.loadingText, { color: textColor }]}>Rendering 3D surface...</Text>
                </View>
            )}

            {errorMessage && (
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: 'red' }]}>Error: {errorMessage}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.infoButton,
                    {
                        backgroundColor: showInfo ? accentColor : 'rgba(0,0,0,0.2)',
                        borderColor: accentColor
                    }
                ]}
                onPress={() => setShowInfo(!showInfo)}
            >
                <Ionicons name="information" size={18} color="#fff" />
            </TouchableOpacity>

            {showInfo && (
                <View style={[styles.infoPanel, { backgroundColor: effectiveTheme === 'dark' ? '#222' : '#f5f5f5' }]}>
                    <Text style={[styles.infoTitle, { color: textColor }]}>3D Visualization Controls</Text>
                    <Text style={[styles.infoText, { color: textColor }]}>• Rotate: Drag with one finger</Text>
                    <Text style={[styles.infoText, { color: textColor }]}>• Zoom: Pinch with two fingers or scroll</Text>
                    <Text style={[styles.infoText, { color: textColor }]}>• Pan: Right-click or three-finger drag</Text>
                    <Text style={[styles.infoHeader, { color: accentColor }]}>Function</Text>
                    <Text style={[styles.infoText, { color: textColor }]}>{mathFunction}</Text>
                </View>
            )}

            <WebView
                source={{ html: htmlContent }}
                style={[styles.webview, { backgroundColor }]}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                onLoad={handleWebViewLoad}
                onError={handleWebViewError}
                onMessage={handleMessage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 400,
        width: '100%',
        marginVertical: 10,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    webview: {
        flex: 1,
        borderRadius: 12,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    infoButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        borderWidth: 1,
    },
    infoPanel: {
        position: 'absolute',
        top: 56,
        right: 10,
        width: 250,
        padding: 12,
        borderRadius: 8,
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        marginBottom: 4,
    }
});

export default Math3DVisualizer;
