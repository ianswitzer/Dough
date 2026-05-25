import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from '../../src/components/TabBar';
import { useTheme } from '../../src/theme';

// Tab navigator with the custom soft TabBar. A top inset spacer keeps screen
// content clear of the status bar (screens themselves don't add safe-area pad).
export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="transactions" />
        <Tabs.Screen name="plan" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </View>
  );
}
