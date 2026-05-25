import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { AsyncBoundary, Card, Header, Icons, Screen, SectionLabel, Toggle, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtMoneyShort } from '../../lib/money';
import { useTheme } from '../../theme';
import { AppearanceControl } from './AppearanceControl';
import { SettingsRow } from './SettingsRow';

export function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const { signOut } = useAuth();

  const { data, loading, error, refetch } = useAsync(async () => {
    const [profile, accounts] = await Promise.all([repos.profile.getCurrent(), repos.accounts.list()]);
    return { profile, accounts };
  }, []);

  // Refresh on focus so a newly-added account appears on return.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const initials = (data?.profile?.displayName ?? data?.profile?.email ?? 'You')
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen onRefresh={refetch}>
      <Header title="Settings" />

      <AsyncBoundary loading={loading} error={error}>
        {/* Profile */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="display" style={{ fontSize: 17 }}>
                {initials}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="medium" style={{ fontSize: 15 }}>
                {data?.profile?.displayName ?? 'Your profile'}
              </Txt>
              <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                {data?.profile?.email} · {data?.profile?.currency ?? 'USD'}
              </Txt>
            </View>
            <Icons.chev color={colors.muted} opacity={0.4} />
          </Card>
        </View>

        {/* Appearance — dark mode toggle */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <SectionLabel>Appearance</SectionLabel>
          <Card padded={false}>
            <AppearanceControl />
          </Card>
        </View>

        {/* Accounts */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <SectionLabel>Accounts</SectionLabel>
          <Card padded={false}>
            {(data?.accounts ?? []).map((a, i) => (
              <SettingsRow
                key={a.id}
                isFirst={i === 0}
                glyph={a.type[0].toUpperCase()}
                glyphBg={a.type === 'credit_card' ? colors.roseSoft : a.type === 'savings' ? colors.sageSoft : colors.accentSoft}
                glyphFg={a.type === 'credit_card' ? colors.roseInk : a.type === 'savings' ? colors.sageInk : colors.accentInk}
                label={a.name}
                sub={a.type}
                right={a.currentBalanceCents != null ? fmtMoneyShort(a.currentBalanceCents) : undefined}
              />
            ))}
            <SettingsRow
              isFirst={(data?.accounts ?? []).length === 0}
              glyph="+"
              glyphBg={colors.mutedSoft}
              glyphFg={colors.ink2}
              label="Add account or import CSV"
              sub="Plaid sync coming soon"
              onPress={() => router.push('/account/new')}
            />
          </Card>
        </View>

        {/* Money */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <SectionLabel>Money</SectionLabel>
          <Card padded={false}>
            <SettingsRow isFirst glyph="◐" label="Categories" sub="10 default" />
            <SettingsRow glyph="◔" label="Tags" sub="Household, Personal, Reimbursable, Trip" />
            <SettingsRow glyph="⊟" label="Rules" sub="Remembered corrections" />
            <SettingsRow glyph="↻" label="Recurring detection" rightControl={<Toggle on />} />
          </Card>
        </View>

        {/* Notifications */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <SectionLabel>Notifications</SectionLabel>
          <Card padded={false}>
            <SettingsRow isFirst glyph="!" label="Unusual charges" rightControl={<Toggle on />} />
            <SettingsRow glyph="↻" label="Bill went up" rightControl={<Toggle on />} />
            <SettingsRow glyph="☑" label="Weekly review" rightControl={<Toggle on={false} />} />
          </Card>
        </View>

        {/* Data */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <SectionLabel>Data</SectionLabel>
          <Card padded={false}>
            <SettingsRow isFirst glyph="↓" label="Export your data" />
            <SettingsRow glyph="×" glyphBg={colors.roseSoft} glyphFg={colors.roseInk} label="Delete account & data" />
            <SettingsRow glyph="⏻" label="Sign out" onPress={signOut} />
          </Card>
        </View>

        <Txt color={colors.muted} style={{ textAlign: 'center', fontSize: 11, paddingVertical: 8 }}>
          Dough · v0.1.0 · made with care
        </Txt>
      </AsyncBoundary>
    </Screen>
  );
}
