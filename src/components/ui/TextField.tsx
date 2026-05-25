import React from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Labeled text input for forms. Themed; matches the calm surface styling.
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.hairline2,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: fonts.ui,
          fontSize: 15,
          color: colors.ink,
        }}
      />
    </View>
  );
}
