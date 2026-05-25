import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, CategoryDot, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { Category } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function BudgetEditScreen() {
  const router = useRouter();
  const repos = useRepositories();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const { data, loading, error } = useAsync(async () => {
    const [month, budgets, categories] = await Promise.all([
      repos.budget.getMonth(y, m),
      repos.budget.listCategoryBudgets(y, m),
      repos.categories.list(),
    ]);
    return { month, budgets, categories: categories.filter((cat) => cat.type === 'expense') };
  }, []);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Plan" />
      <Header title="Edit budget" subtitle={now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
      <AsyncBoundary loading={loading} error={error}>
        {data ? (
          <BudgetForm
            monthId={data.month?.id}
            categories={data.categories}
            limits={Object.fromEntries(data.budgets.map((b) => [b.categoryId, b.limitCents]))}
            onSaved={() => router.back()}
          />
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

function BudgetForm({
  monthId,
  categories,
  limits,
  onSaved,
}: {
  monthId?: string;
  categories: Category[];
  limits: Record<string, number>;
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const initial = useMemo(
    () => Object.fromEntries(categories.map((cat) => [cat.id, limits[cat.id] ? String(limits[cat.id] / 100) : ''])),
    [categories, limits],
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!monthId) return;
    setSaving(true);
    setError(null);
    try {
      for (const cat of categories) {
        const dollars = parseFloat((values[cat.id] ?? '').replace(/[^0-9.]/g, ''));
        await repos.budget.setCategoryLimit(monthId, cat.id, Number.isFinite(dollars) ? Math.round(dollars * 100) : 0);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  if (!monthId) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <Txt color={colors.muted}>No budget month exists yet. Finish onboarding or reload defaults first.</Txt>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      {categories.map((cat) => (
        <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <CategoryDot name={cat.name} tintKey={cat.tint} size={34} />
          <View style={{ flex: 1 }}>
            <TextField
              label={cat.name}
              value={values[cat.id] ?? ''}
              onChangeText={(v) => setValues((cur) => ({ ...cur, [cat.id]: v }))}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      ))}
      {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
      <PrimaryButton onPress={save} loading={saving}>
        Save budget
      </PrimaryButton>
    </View>
  );
}
