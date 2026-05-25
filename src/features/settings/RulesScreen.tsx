import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  Header,
  PrimaryButton,
  Screen,
  TextField,
  Toggle,
  Txt,
} from '../../components/ui';
import type { Category, MerchantRule } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { useCategories } from '../shared/useCategories';

export function RulesScreen() {
  const repos = useRepositories();
  const { list } = useCategories();
  const { data, loading, error, refetch } = useAsync(() => repos.rules.list(), []);

  return (
    <Screen tail={40} onRefresh={refetch}>
      <ModalHeader backLabel="Settings" />
      <Header title="Rules" subtitle="Remembered merchant corrections" />
      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(data ?? []).length === 0 ? <EmptyRules /> : null}
          {(data ?? []).map((rule) => (
            <RuleEditor key={rule.id} rule={rule} categories={list} onChanged={refetch} />
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
  categories,
  onChanged,
}: {
  rule: MerchantRule;
  categories: Category[];
  onChanged: () => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [match, setMatch] = useState(rule.matchValue);
  const [renameTo, setRenameTo] = useState(rule.renameTo ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(rule.setCategoryId);
  const [hidden, setHidden] = useState(rule.setHiddenFromBudget ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await repos.rules.update(rule.id, {
        matchValue: match.trim(),
        renameTo: renameTo.trim() || null,
        setCategoryId: categoryId,
        setHiddenFromBudget: hidden,
      });
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
      <TextField label={ruleLabel(rule.matchType)} value={match} onChangeText={setMatch} />
      <TextField label="Rename to" value={renameTo} onChangeText={setRenameTo} placeholder="Optional merchant name" />
      <View style={{ gap: 8 }}>
        <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
          Categorize as
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((cat) => {
            const on = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(on ? null : cat.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: on ? colors.ink : colors.surface,
                  borderWidth: 0.5,
                  borderColor: on ? colors.ink : colors.hairline2,
                }}
              >
                <CategoryDot name={cat.name} tintKey={cat.tint} size={18} />
                <Txt color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                  {cat.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Txt color={colors.ink2} style={{ fontSize: 13.5 }}>Hide matching charges from budgets</Txt>
        <Toggle on={hidden} onChange={setHidden} />
      </View>
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

function ruleLabel(matchType: string) {
  if (matchType === 'raw_description_contains') return 'Merchant contains';
  if (matchType === 'exact_description') return 'Description is exactly';
  if (matchType === 'merchant_id') return 'Merchant is';
  if (matchType === 'amount_range') return 'Amount is near';
  if (matchType === 'account_id') return 'Account is';
  return 'Match';
}
