import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';


type ColorNameType = 'text' | 'background' | 'tint' | 'accent' | 'tertiary' |
                    'tabIconDefault' | 'tabIconSelected' | 'card' | 'border' |
                    'notification' | 'error' | 'success' | 'warning' | 'info' |
                    'surface' | 'surfaceVariant' | 'buttonGradientStart' |
                    'buttonGradientEnd' | 'icon' | 'cardBackground';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: ColorNameType
) {
  const { effectiveTheme } = useTheme();

  const colorFromProps = props && effectiveTheme && (effectiveTheme in props)
      ? props[effectiveTheme as keyof typeof props]
      : undefined;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    if (Colors && Colors[effectiveTheme] && Colors[effectiveTheme][colorName as keyof typeof Colors.light]) {
      return Colors[effectiveTheme][colorName as keyof typeof Colors.light];
    }

    return effectiveTheme === 'dark' ? '#FFFFFF' : '#000000';
  }
}
