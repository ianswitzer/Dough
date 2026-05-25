import React from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useTheme, type ThemePreference } from '../../theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Dark-mode toggle (3-way segmented). Drives the ThemeProvider preference and
// mirrors the choice to the profile so it follows the user across devices.
export function AppearanceControl() {
  const { colors, preference, setPreference, radius } = useTheme();
  const repos = useRepositories();

  const choose = (p: ThemePreference) => {
    setPreference(p);
    repos.profile.update({ darkMode: p }).catch(() => {});
  };

  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.paper2, borderRadius: radius.md, padding: 3, margin: 12, gap: 3 }}>
      {OPTIONS.map((o) => {
        const on = preference === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => choose(o.value)}
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
