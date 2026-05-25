import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { Icons, type IconName, Txt } from './ui';

// Minimal shape of the navigator props we actually use — avoids depending on
// @react-navigation/bottom-tabs typings, which expo-router doesn't re-export.
type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

// Bottom nav matching the design: line icon + label, accent when active.
const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Today', icon: 'today' },
  { name: 'transactions', label: 'Transactions', icon: 'list' },
  { name: 'plan', label: 'Plan', icon: 'plan' },
  { name: 'insights', label: 'Insights', icon: 'spark' },
  { name: 'settings', label: 'Settings', icon: 'gear' },
];

export function TabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 8,
        backgroundColor: colors.paper,
        borderTopWidth: 0.5,
        borderTopColor: colors.hairline2,
      }}
    >
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? colors.accentInk : colors.muted;
        const Icon = Icons[tab.icon];
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}
          >
            <Icon color={color} opacity={focused ? 1 : 0.85} />
            <Txt variant={focused ? 'semibold' : 'medium'} color={color} style={{ fontSize: 10.5 }}>
              {tab.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
