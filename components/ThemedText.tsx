import { Text, TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

type ThemedTextProps = TextProps & {
  type?: 'title' | 'subtitle' | 'default' | 'defaultSemiBold';
  lightColor?: string;
  darkColor?: string;
};

export function ThemedText(props: ThemedTextProps) {
  const { type = 'default', style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  let textStyle = {};
  switch (type) {
    case 'title':
      textStyle = { fontSize: 24, fontWeight: 'bold' };
      break;
    case 'subtitle':
      textStyle = { fontSize: 18, fontWeight: 'bold' };
      break;
    case 'defaultSemiBold':
      textStyle = { fontSize: 16, fontWeight: '600' };
      break;
    default:
      textStyle = { fontSize: 16 };
  }

  return <Text style={[{ color }, textStyle, style]} {...otherProps} />;
}
