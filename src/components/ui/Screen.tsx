import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

// Scrollable screen body on the paper background. Hides scrollbars to match the
// calm design. `tail` adds bottom padding so content clears the tab bar.
export function Screen({
  children,
  style,
  tail = 110,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tail?: number;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.paper }, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 4 }}
    >
      {children}
      <View style={{ height: tail }} />
    </ScrollView>
  );
}
