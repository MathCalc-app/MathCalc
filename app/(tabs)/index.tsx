import { StyleSheet } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useThemeColor} from "@/hooks/useThemeColor";

export default function HomeScreen() {
  const textColor = useThemeColor({}, 'text');
  return (
      <ParallaxScrollView
          headerBackgroundColor={{ light: '#dc712f', dark: '#ff8558' }}
          text="MathCalc"
      >
        <ThemedView style={styles.titleContainer}>
          <HelloWave />
          <ThemedText type="title">Welcome to</ThemedText>
          <ThemedText type="title">MathCalc!</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Scan a mathematical problem</ThemedText>
          <ThemedText>
            Tap the <ThemedText type="defaultSemiBold">Calculator</ThemedText> tab to be able to scan and ask the AI to explain and help you with your problem.
          </ThemedText>

          <ThemedText type="subtitle">Visualize mathematical functions</ThemedText>
          <ThemedText>
            Tap the <ThemedText type="defaultSemiBold">Visualize</ThemedText> tab to see 2D and 3D graphs of mathematical functions.
          </ThemedText>

          <ThemedText type="subtitle">Practice with AI-generated problems</ThemedText>
          <ThemedText>
            Tap the <ThemedText type="defaultSemiBold">Practice</ThemedText> tab to generate and solve custom practice problems powered by AI.
          </ThemedText>

          <ThemedText type="subtitle">See your history and stats</ThemedText>
          <ThemedText>
            Tap the <ThemedText type="defaultSemiBold">Dashboard</ThemedText> tab to see your history and stats.
          </ThemedText>

          <ThemedText type="subtitle">Make MathCalc yours</ThemedText>
          <ThemedText>
            Tap the <ThemedText type="defaultSemiBold">Settings</ThemedText> tab to change settings of MathCalc, such as the theme and how the AI acts.
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.footer}>
          <ThemedText style={[styles.versionText, { color: textColor, opacity: 0.5 }]}>
            MathCalc v0.0.7
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
  );

}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  versionText: {
    fontSize: 12,
  }
});
