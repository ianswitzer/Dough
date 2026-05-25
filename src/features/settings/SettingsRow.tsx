import React from 'react';
import { Pressable, View } from 'react-native';

import { Icons, Txt } from '../../components/ui';
import { useTheme } from '../../theme';

// One settings row: optional glyph badge, label + sub, and a right slot
// (text, chevron, or a custom control like a Toggle).
export function SettingsRow({
  glyph,
  glyphBg,
  glyphFg,
  label,
  sub,
  right,
  rightControl,
  isFirst,
  onPress,
}: {
  glyph?: string;
  glyphBg?: string;
  glyphFg?: string;
  label: string;
  sub?: string;
  right?: string;
  rightControl?: React.ReactNode;
  isFirst?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: colors.hairline,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      {glyph ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: glyphBg ?? colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt color={glyphFg ?? colors.accentInk} style={{ fontSize: 14 }}>
            {glyph}
          </Txt>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt style={{ fontSize: 14.5 }}>{label}</Txt>
        {sub ? (
          <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {right ? (
        <Txt color={colors.muted} style={{ fontSize: 13 }}>
          {right}
        </Txt>
      ) : null}
      {rightControl ?? (right ? null : <Icons.chev color={colors.muted} opacity={0.4} />)}
    </Pressable>
  );
}
