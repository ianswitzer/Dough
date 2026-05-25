import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';

// Renders loading / error states for a useAsync result, otherwise children.
// Keeps screens free of repeated loading/error markup.
export function AsyncBoundary({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  if (loading) {
    return (
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentInk} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ paddingVertical: 60, paddingHorizontal: 30, alignItems: 'center' }}>
        <Txt color={colors.roseInk} style={{ textAlign: 'center' }}>
          {error}
        </Txt>
      </View>
    );
  }
  return <>{children}</>;
}
