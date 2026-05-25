import React, { useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Card, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { SavedView } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function SavedViewsEditScreen() {
  const repos = useRepositories();
  const { data, loading, error, refetch } = useAsync(() => repos.savedViews.list(), []);

  return (
    <Screen tail={40} onRefresh={refetch}>
      <ModalHeader backLabel="Insights" />
      <Header title="Saved views" subtitle="Names and filter JSON" />
      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(data ?? []).map((view) => <SavedViewEditor key={view.id} view={view} onChanged={refetch} />)}
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

function SavedViewEditor({ view, onChanged }: { view: SavedView; onChanged: () => Promise<unknown> }) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(view.name);
  const [filters, setFilters] = useState(JSON.stringify(view.filters, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await repos.savedViews.update(view.id, { name: name.trim(), filters: JSON.parse(filters) });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save view');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <TextField label={view.slug} value={name} onChangeText={setName} />
      <TextField
        label="Filters JSON"
        value={filters}
        onChangeText={setFilters}
        autoCapitalize="none"
        multiline
        numberOfLines={5}
      />
      {view.isDefault ? <Txt color={colors.muted} style={{ fontSize: 12 }}>Default view</Txt> : null}
      {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
      <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()}>
        Save view
      </PrimaryButton>
    </Card>
  );
}
