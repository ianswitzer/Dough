import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

// Scrollable screen body on the paper background. Hides scrollbars to match the
// calm design. `tail` adds bottom padding so content clears the tab bar.
// Pass `onRefresh` (returning a promise) to enable pull-to-refresh; Screen owns
// the spinner state so callers just hand over their refetch.
export function Screen({
  children,
  style,
  tail = 110,
  onRefresh,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tail?: number;
  onRefresh?: () => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.paper }, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 4 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.muted} colors={[colors.accentInk]} />
        ) : undefined
      }
    >
      {children}
      <View style={{ height: tail }} />
    </ScrollView>
  );
}
