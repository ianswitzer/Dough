import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Icons, Txt } from '../../components/ui';
import { useTheme } from '../../theme';

// Back affordance for modal overlay screens. Labels the parent it returns to.
export function ModalHeader({ backLabel }: { backLabel: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
      <Pressable
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
        hitSlop={10}
      >
        <Icons.back color={colors.accentInk} />
        <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 13 }}>
          {backLabel}
        </Txt>
      </Pressable>
    </View>
  );
}
