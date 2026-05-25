import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

// Soft rounded card on the surface color. Becomes pressable when onPress is set.
export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padded?: boolean;
}) {
  const { colors, radius } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: padded ? 18 : 0,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.7 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
