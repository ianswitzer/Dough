import React from 'react';
import { ActivityIndicator, Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Filled ink button — the main CTA. `tone="ghost"` gives a bordered variant.
export function PrimaryButton({
  children,
  onPress,
  loading = false,
  disabled = false,
  tone = 'ink',
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'ink' | 'ghost';
  style?: ViewStyle;
}) {
  const { colors, radius } = useTheme();
  const ink = tone === 'ink';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          width: '100%',
          paddingVertical: 15,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: ink ? colors.ink : colors.surface,
          borderWidth: ink ? 0 : 0.5,
          borderColor: colors.hairline2,
          opacity: pressed || disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ink ? colors.onInk : colors.ink} />
      ) : (
        <Txt variant="medium" color={ink ? colors.onInk : colors.ink} style={{ fontSize: 15 }}>
          {children}
        </Txt>
      )}
    </Pressable>
  );
}
