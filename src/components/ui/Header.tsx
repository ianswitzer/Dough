import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Soft screen header: optional left/subtitle, big serif title, optional action.
export function Header({
  title,
  subtitle,
  action,
  left,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  left?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingTop: 6,
        paddingHorizontal: 22,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        {left}
        {subtitle ? (
          <Txt color={colors.muted} style={{ fontSize: 12.5, marginBottom: 4 }}>
            {subtitle}
          </Txt>
        ) : null}
        <Txt variant="display" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.5 }}>
          {title}
        </Txt>
      </View>
      {action}
    </View>
  );
}
