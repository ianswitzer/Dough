import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Card, CategoryDot, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { Category } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function CategoriesScreen() {
  const repos = useRepositories();
  const { data, loading, error, refetch } = useAsync(() => repos.categories.list(), []);

  return (
    <Screen tail={40} onRefresh={refetch}>
      <ModalHeader backLabel="Settings" />
      <Header title="Categories" subtitle="Names and color tints" />
      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(data ?? []).map((cat) => <CategoryEditor key={cat.id} category={cat} />)}
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

function CategoryEditor({ category }: { category: Category }) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await repos.categories.update(category.id, { name: name.trim() || category.name });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <CategoryDot name={name} tintKey={category.tint} size={34} />
        <View style={{ flex: 1 }}>
          <TextField label={category.slug} value={name} onChangeText={setName} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt color={colors.muted} style={{ flex: 1, fontSize: 12 }}>
          {category.type} · {category.tint}
        </Txt>
        {saved ? <Txt color={colors.sageInk} style={{ fontSize: 12 }}>Saved</Txt> : null}
        <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()} style={{ width: 96, paddingVertical: 10 }}>
          Save
        </PrimaryButton>
      </View>
    </Card>
  );
}
