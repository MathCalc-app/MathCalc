import { StyleSheet, Dimensions, Platform, View, Image, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from "@/hooks/useThemeColor";
import { Collapsible } from "@/components/Collapsible";
import React, { useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { effectiveTheme } = useTheme();
  const router = useRouter();

  const cardTextColor = effectiveTheme === 'dark' 
    ? cardBackground === '#000000' || cardBackground.startsWith('#0') || cardBackground.startsWith('#1') || cardBackground.startsWith('#2')
      ? '#FFFFFF' 
      : '#000000'
    : cardBackground === '#FFFFFF' || cardBackground.startsWith('#F') || cardBackground.startsWith('#E') || cardBackground.startsWith('#D')
      ? '#000000'
      : '#FFFFFF';

  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const featureCards = [
    {
      title: "Calculator",
      icon: "plus.forwardslash.minus",
      description: "Scan and solve mathematical problems with AI assistance",
      route: "/calculator"
    },
    {
      title: "Visualize",
      icon: "function",
      description: "See 2D and 3D graphs of mathematical functions",
      route: "/visualize"
    },
    {
      title: "Practice",
      icon: "books.vertical",
      description: "Generate and solve custom practice problems with AI",
      route: "/practice"
    },
    {
      title: "Dashboard",
      icon: "chart.bar",
      description: "Track your progress and view your statistics",
      route: "/dashboard"
    },
    {
      title: "Settings",
      icon: "gear",
      description: "Customize MathCalc to fit your preferences",
      route: "/settings"
    }
  ];

  const headerDecorationElement = (
    <View style={{ 
      width: '100%', 
      height: '100%',
      position: 'absolute',
      overflow: 'hidden',
    }}>
      <Animated.View style={{
        position: 'absolute',
        bottom: 30,
        left: 10,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }} />
      <Animated.View style={{
        position: 'absolute',
        top: 100,
        left: 40,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }} />
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#dc712f', dark: '#ff8558' }}
      backgroundImage={require('@/assets/images/background.jpg')}
      text="MathCalc"
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
      decorationElement={headerDecorationElement}
      showBlurEffect={true}
    >
      <ThemedView style={styles.container}>
        <Animated.View style={[styles.welcomeCard, { 
          opacity: fadeAnim, 
          backgroundColor: cardBackground,
          borderWidth: effectiveTheme === 'dark' ? 1 : 0,
          borderColor: 'rgba(255,255,255,0.1)'
        }]}>
          <LinearGradient
            colors={['rgba(220, 113, 47, 0.2)', 'rgba(255, 133, 88, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          />
          <View style={styles.welcomeContent}>
            <HelloWave />
            <View style={styles.welcomeTextContainer}>
              <ThemedText type="title" style={[styles.welcomeTitle, { color: cardTextColor }]}>Welcome to MathCalc</ThemedText>
              <ThemedText style={[styles.welcomeSubtitle, { color: cardTextColor, opacity: 0.8 }]}>Your personal math assistant powered by AI</ThemedText>
            </View>
          </View>
        </Animated.View>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Explore MathCalc
        </ThemedText>

        <View style={styles.featureCardsContainer}>
          {featureCards.map((card, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(card.route as any)}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <Animated.View
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: cardBackground,
                    borderWidth: effectiveTheme === 'dark' ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.1)',
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })}]
                  }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
                  <IconSymbol name={card.icon} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.cardTextContainer}>
                  <ThemedText type="defaultSemiBold" style={[styles.cardTitle, { color: cardTextColor }]}>{card.title}</ThemedText>
                  <ThemedText style={[styles.cardDescription, { color: cardTextColor, opacity: 0.7 }]}>{card.description}</ThemedText>
                </View>
              </Animated.View>
            </Pressable>
          ))}
        </View>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Quick Tips
        </ThemedText>

        <View style={styles.tipsContainer}>
          <ThemedView style={[styles.tipCard, { 
            backgroundColor: cardBackground,
            borderWidth: effectiveTheme === 'dark' ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.1)'
          }]}>
            <ThemedText type="defaultSemiBold" style={[styles.tipTitle, { color: cardTextColor }]}>
              <IconSymbol name="lightbulb.fill" size={16} color={tintColor} /> Pro Tip
            </ThemedText>
            <ThemedText style={[styles.tipText, { color: cardTextColor }]}>
              Use the camera to scan printed math problems for instant solutions
            </ThemedText>
          </ThemedView>

          <ThemedView style={[styles.tipCard, { 
            backgroundColor: cardBackground,
            borderWidth: effectiveTheme === 'dark' ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.1)'
          }]}>
            <ThemedText type="defaultSemiBold" style={[styles.tipTitle, { color: cardTextColor }]}>
              <IconSymbol name="hand.tap.fill" size={16} color={tintColor} /> Getting Started
            </ThemedText>
            <ThemedText style={[styles.tipText, { color: cardTextColor }]}>
              Swipe between tabs or use the tab bar to navigate the app
            </ThemedText>
          </ThemedView>
        </View>
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
    paddingTop: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    opacity: 0.8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    marginTop: 8,
  },
  featureCardsContainer: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});
