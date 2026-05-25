import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Generic segmented selector. Options are { value, label }; controlled.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.paper2, borderRadius: radius.md, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: radius.sm,
              alignItems: 'center',
              backgroundColor: on ? colors.surface : 'transparent',
              borderWidth: on ? 0.5 : 0,
              borderColor: colors.hairline2,
            }}
          >
            <Txt variant={on ? 'semibold' : 'medium'} color={on ? colors.ink : colors.muted} style={{ fontSize: 13 }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
