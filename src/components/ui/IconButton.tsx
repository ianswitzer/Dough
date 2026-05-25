import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '../../theme';

// Round bordered icon button used in headers.
export function IconButton({
  children,
  onPress,
  size = 40,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface,
        borderWidth: 0.5,
        borderColor: colors.hairline2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
