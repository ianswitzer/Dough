import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme';

// Soft switch. Controlled: pass `on` and `onChange`.
export function Toggle({ on, onChange }: { on: boolean; onChange?: (next: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onChange?.(!on)} hitSlop={8}>
      <View
        style={{
          width: 38,
          height: 23,
          borderRadius: 12,
          backgroundColor: on ? colors.sageInk : colors.hairline2,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#fff',
            marginLeft: on ? 17 : 3,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        />
      </View>
    </Pressable>
  );
}
