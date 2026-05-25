import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Uppercase caption with an optional right-aligned action (e.g. "Open inbox →").
export function SectionLabel({
  children,
  right,
  onPressRight,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  onPressRight?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 10,
      }}
    >
      <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {children}
      </Txt>
      {right ? (
        <Pressable onPress={onPressRight} disabled={!onPressRight}>
          <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 13 }}>
            {right}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
