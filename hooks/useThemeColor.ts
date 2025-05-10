import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { effectiveTheme } = useTheme();

  const colorFromProps = props && effectiveTheme && (effectiveTheme in props)
      ? props[effectiveTheme as keyof typeof props]
      : undefined;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    if (Colors && Colors[effectiveTheme] && Colors[effectiveTheme][colorName]) {
      return Colors[effectiveTheme][colorName];
    }

    return effectiveTheme === 'dark' ? '#FFFFFF' : '#000000';
  }
}
