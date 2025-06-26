import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, ImageBackground } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerBackgroundColor?: { dark: string; light: string },
  backgroundImage?: { uri: string } | number,
  text?: string,
  contentContainerStyle?: { paddingBottom: any },
  decorationElement?: ReactElement,
  showBlurEffect?: boolean,
}>;

export default function ParallaxScrollView({
  children,
  headerBackgroundColor,
  backgroundImage,
  text,
  contentContainerStyle,
  decorationElement,
  showBlurEffect = true,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  
  const blurIntensity = useDerivedValue(() => {
    return interpolate(
      scrollOffset.value,
      [0, HEADER_HEIGHT * 0.5],
      [0, 15],
      { extrapolateRight: 'clamp' }
    );
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, HEADER_HEIGHT * 0.4],
        [1, 0]
      ),
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT * 0.5],
            [-HEADER_HEIGHT / 3, 0, HEADER_HEIGHT * 0.2]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [1.5, 1, 0.8]
          ),
        },
      ],
    };
  });

  const decorationAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, HEADER_HEIGHT * 0.5],
        [1, 0.3]
      ),
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT * 0.5],
            [-50, 0, 100]
          ),
        },
        {
          translateX: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT * 0.5],
            [-30, 0, 50]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [1.2, 1, 0.8]
          ),
        },
      ],
    };
  });

  const blurAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, HEADER_HEIGHT * 0.3],
        [0, 1],
        { extrapolateLeft: 'clamp' }
      )
    };
  });

  const renderHeaderContent = () => {
    const background = backgroundImage ? (
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {showBlurEffect && (
          <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
            <BlurView intensity={15} style={StyleSheet.absoluteFill} tint={colorScheme} />
          </Animated.View>
        )}
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)'] 
            : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.gradientOverlay}
        />
      </ImageBackground>
    ) : (
      headerBackgroundColor && (
        <Animated.View 
          style={[
            styles.backgroundColor, 
            { backgroundColor: headerBackgroundColor[colorScheme] }
          ]} 
        />
      )
    );

    return (
      <>
        {background}
        {text && (
          <Animated.View style={[styles.headerTextContainer, textAnimatedStyle]}>
            <ThemedText style={styles.headerText}>{text}</ThemedText>
          </Animated.View>
        )}
        {decorationElement && (
          <Animated.View style={[styles.decorationContainer, decorationAnimatedStyle]}>
            {decorationElement}
          </Animated.View>
        )}
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom, ...contentContainerStyle }}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          {renderHeaderContent()}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundColor: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  headerText: {
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  decorationContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
