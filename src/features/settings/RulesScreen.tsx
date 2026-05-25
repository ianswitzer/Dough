import React, { useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Card, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { MerchantRule } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { useCategories } from '../shared/useCategories';

export function RulesScreen() {
  const repos = useRepositories();
  const { byId } = useCategories();
  const { data, loading, error, refetch } = useAsync(() => repos.rules.list(), []);

  return (
    <Screen tail={40} onRefresh={refetch}>
      <ModalHeader backLabel="Settings" />
      <Header title="Rules" subtitle="Remembered merchant corrections" />
      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(data ?? []).length === 0 ? <EmptyRules /> : null}
          {(data ?? []).map((rule) => (
            <RuleEditor key={rule.id} rule={rule} categoryName={rule.setCategoryId ? byId[rule.setCategoryId]?.name : undefined} onChanged={refetch} />
          ))}
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

function EmptyRules() {
  const { colors } = useTheme();
  return (
    <Card>
      <Txt color={colors.muted} style={{ fontSize: 13, lineHeight: 19 }}>
        Rules appear when you change a transaction category and choose to apply it to future charges.
      </Txt>
    </Card>
  );
}

function RuleEditor({
  rule,
  categoryName,
  onChanged,
}: {
  rule: MerchantRule;
  categoryName?: string;
  onChanged: () => Promise<unknown>;
}) {
  const repos = useRepositories();
  const [match, setMatch] = useState(rule.matchValue);
  const [renameTo, setRenameTo] = useState(rule.renameTo ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await repos.rules.update(rule.id, { matchValue: match.trim(), renameTo: renameTo.trim() || null });
      await onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await repos.rules.deactivate(rule.id);
      await onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <TextField label={rule.matchType} value={match} onChangeText={setMatch} />
      <TextField label="Rename to" value={renameTo} onChangeText={setRenameTo} placeholder="Optional merchant name" />
      <Txt style={{ fontSize: 13 }}>Category: {categoryName ?? 'No category set'}</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton onPress={save} loading={saving} disabled={!match.trim()} style={{ flex: 1 }}>
          Save
        </PrimaryButton>
        <PrimaryButton onPress={remove} loading={saving} tone="ghost" style={{ width: 112 }}>
          Disable
        </PrimaryButton>
      </View>
    </Card>
  );
}
