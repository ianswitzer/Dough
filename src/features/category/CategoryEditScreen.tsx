import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, CategoryDot, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { Category } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function CategoryEditScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const repos = useRepositories();
  const now = new Date();
  const { data, loading, error } = useAsync(async () => {
    const [categories, month, budgets] = await Promise.all([
      repos.categories.list(),
      repos.budget.getMonth(now.getFullYear(), now.getMonth() + 1),
      repos.budget.listCategoryBudgets(now.getFullYear(), now.getMonth() + 1),
    ]);
    const category = categories.find((cat) => cat.slug === slug);
    return {
      category,
      monthId: month?.id,
      limitCents: category ? budgets.find((budget) => budget.categoryId === category.id)?.limitCents ?? 0 : 0,
    };
  }, [slug]);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Category" />
      <Header title="Edit category" subtitle="Name and monthly budget" />
      <AsyncBoundary loading={loading} error={error}>
        {data?.category ? (
          <CategoryForm
            category={data.category}
            monthId={data.monthId}
            limitCents={data.limitCents}
            onSaved={() => router.back()}
          />
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

function CategoryForm({
  category,
  monthId,
  limitCents,
  onSaved,
}: {
  category: Category;
  monthId?: string;
  limitCents: number;
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(category.name);
  const [budget, setBudget] = useState(limitCents ? String(limitCents / 100) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const dollars = parseFloat(budget.replace(/[^0-9.]/g, ''));
      await repos.categories.update(category.id, { name: name.trim() || category.name });
      if (monthId) {
        await repos.budget.setCategoryLimit(
          monthId,
          category.id,
          Number.isFinite(dollars) ? Math.round(dollars * 100) : 0,
        );
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      <View style={{ alignItems: 'center', paddingBottom: 4 }}>
        <CategoryDot name={name || category.name} tintKey={category.tint} size={52} />
      </View>
      <TextField label="Name" value={name} onChangeText={setName} />
      <TextField
        label="Monthly budget"
        value={budget}
        onChangeText={setBudget}
        placeholder="0"
        keyboardType="decimal-pad"
      />
      <Txt color={colors.muted} style={{ fontSize: 12, lineHeight: 18, paddingHorizontal: 4, marginTop: -8 }}>
        The internal slug stays stable so existing transactions and saved views keep working.
      </Txt>
      {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
      <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()}>
        Save category
      </PrimaryButton>
    </View>
  );
}
