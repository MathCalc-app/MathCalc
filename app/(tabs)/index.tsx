
import { StyleSheet, Dimensions, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from "@/hooks/useThemeColor";
import { Collapsible } from "@/components/Collapsible";
import React from "react";
import {AppFooter} from "@/components/AppFooter";

export default function HomeScreen() {
  const textColor = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;

  return (
      <ParallaxScrollView
          headerBackgroundColor={{ light: '#dc712f', dark: '#ff8558' }}
          text="MathCalc"
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.titleContainer}>
            <HelloWave />
            <ThemedText type="title">Welcome to</ThemedText>
            <ThemedText type="title">MathCalc!</ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <ThemedView style={styles.collapsibleItem}>
              <Collapsible title="Scan a mathematical problem">
                <ThemedText>
                  Tap the <ThemedText type="defaultSemiBold">Calculator</ThemedText> tab to be able to scan and ask the AI to explain and help you with your problem.
                </ThemedText>
              </Collapsible>
            </ThemedView>

            <ThemedView style={styles.collapsibleItem}>
              <Collapsible title="Visualize mathematical functions">
                <ThemedText>
                  Tap the <ThemedText type="defaultSemiBold">Visualize</ThemedText> tab to see 2D and 3D graphs of mathematical functions.
                </ThemedText>
              </Collapsible>
            </ThemedView>

            <ThemedView style={styles.collapsibleItem}>
              <Collapsible title="Practice with AI-generated problems">
                <ThemedText>
                  Tap the <ThemedText type="defaultSemiBold">Practice</ThemedText> tab to generate and solve custom practice problems powered by AI.
                </ThemedText>
              </Collapsible>
            </ThemedView>

            <ThemedView style={styles.collapsibleItem}>
              <Collapsible title="See your history and stats">
                <ThemedText>
                  Tap the <ThemedText type="defaultSemiBold">Dashboard</ThemedText> tab to see your history and stats.
                </ThemedText>
              </Collapsible>
            </ThemedView>

            <ThemedView style={styles.collapsibleItem}>
              <Collapsible title="Make MathCalc yours">
                <ThemedText>
                  Tap the <ThemedText type="defaultSemiBold">Settings</ThemedText> tab to change settings of MathCalc, such as the theme and how the AI acts.
                </ThemedText>
              </Collapsible>
            </ThemedView>
          </ThemedView>
          <AppFooter/>
        </ThemedView>
      </ParallaxScrollView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height - 200,
    width: '100%',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 16,
    paddingBottom: 24,
    flex: 1,
  },
  collapsibleItem: {
    marginBottom: 16,
    width: '90%',
    maxWidth: 500,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
    backgroundColor: 'transparent',
  },
  versionText: {
    fontSize: 14,
  }
});
