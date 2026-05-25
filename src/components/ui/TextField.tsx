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
  editable = true,
  multiline = false,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
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
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
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
          minHeight: multiline ? 120 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
          opacity: editable ? 1 : 0.65,
        }}
      />
    </View>
  );
}
