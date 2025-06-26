import React from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemeToggleProps {
  compact?: boolean;
  showLabel?: boolean;
}

const ThemeToggle = ({ compact = false, showLabel = true }: ThemeToggleProps) => {
  // @ts-ignore
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');

  const [animatedValue] = React.useState(new Animated.Value(isDark ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const knobPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, compact ? 22 : 30]
  });

  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f4f4f4', '#333']
  });

  const knobColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [tintColor, '#fff']
  });

  const knobShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.4]
  });

  const toggleWidth = compact ? 50 : 60;
  const toggleHeight = compact ? 24 : 30;
  const knobSize = compact ? 20 : 26;

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[
          styles.label,
          { color: textColor, marginRight: compact ? 8 : 12 }
        ]}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleTheme}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.toggleContainer,
            {
              backgroundColor: bgColor,
              width: toggleWidth,
              height: toggleHeight,
              borderRadius: toggleHeight / 2
            }
          ]}
        >
          <Animated.View
            style={[
              styles.knob,
              {
                width: knobSize,
                height: knobSize,
                borderRadius: knobSize / 2,
                transform: [{ translateX: knobPosition }],
                backgroundColor: knobColor,
                shadowOpacity: knobShadowOpacity
              }
            ]}
          >
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={compact ? 12 : 16}
              color={isDark ? '#333' : '#fff'}
              style={styles.icon}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  touchable: {
    justifyContent: 'center',
  },
  toggleContainer: {
    justifyContent: 'center',
    padding: 2,
  },
  knob: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    alignSelf: 'center',
  }
});

export default ThemeToggle;
