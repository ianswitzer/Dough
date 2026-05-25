import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '../../theme';

type Variant = 'display' | 'displayItalic' | 'body' | 'medium' | 'semibold' | 'mono';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
};

// Single themed Text wrapper so every label picks the right font family and a
// sensible default color. Pass `color` for a token override; `style` for the
// rest. Money numerics use variant="mono" for tabular figures.
export function Txt({ variant = 'body', color, style, ...rest }: Props) {
  const { fonts, colors } = useTheme();
  const family: Record<Variant, string> = {
    display: fonts.display,
    displayItalic: fonts.displayItalic,
    body: fonts.ui,
    medium: fonts.uiMedium,
    semibold: fonts.uiSemibold,
    mono: fonts.mono,
  };
  return (
    <Text
      {...rest}
      style={[{ fontFamily: family[variant], color: color ?? colors.ink }, style]}
    />
  );
}
