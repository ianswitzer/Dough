import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryDot, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

const TINTS = ['accent', 'sage', 'rose', 'sky', 'plum', 'muted'];

export function NewCategoryScreen() {
  const router = useRouter();
  const repos = useRepositories();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [tint, setTint] = useState('accent');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const dollars = parseFloat(budget.replace(/[^0-9.]/g, ''));
      const category = await repos.categories.create({
        name: name.trim(),
        tint,
        monthlyLimitCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : 0,
      });
      router.replace(`/category/${category.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Plan" />
      <Header title="New category" subtitle="Add a spending bucket" />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <CategoryDot name={name || 'Category'} tintKey={tint} size={52} />
        </View>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Books" />
        <TextField label="Monthly budget" value={budget} onChangeText={setBudget} placeholder="0" keyboardType="decimal-pad" />
        <View style={{ gap: 8 }}>
          <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Color
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TINTS.map((key) => {
              const selected = tint === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTint(key)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.ink : colors.surface,
                    borderWidth: 0.5,
                    borderColor: selected ? colors.ink : colors.hairline2,
                  }}
                >
                  <Txt color={selected ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                    {key}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </View>
        {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
        <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()}>
          Create category
        </PrimaryButton>
      </View>
    </Screen>
  );
}
