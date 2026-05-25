import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Card, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import type { Tag } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function TagsScreen() {
  const repos = useRepositories();
  const { data, loading, error, refetch } = useAsync(() => repos.tags.list(), []);
  const [newName, setNewName] = useState('');

  const create = async () => {
    if (!newName.trim()) return;
    await repos.tags.create({ name: newName.trim() });
    setNewName('');
    await refetch();
  };

  return (
    <Screen tail={40} onRefresh={refetch}>
      <ModalHeader backLabel="Settings" />
      <Header title="Tags" subtitle="Custom transaction labels" />
      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Card style={{ gap: 12 }}>
            <TextField label="New tag" value={newName} onChangeText={setNewName} placeholder="e.g. Work trip" />
            <PrimaryButton onPress={create} disabled={!newName.trim()}>
              Add tag
            </PrimaryButton>
          </Card>
          {(data ?? []).map((tag) => <TagEditor key={tag.id} tag={tag} onChanged={refetch} />)}
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

function TagEditor({ tag, onChanged }: { tag: Tag; onChanged: () => Promise<unknown> }) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(tag.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(tag.name);
  }, [tag.name]);

  const save = async () => {
    setSaving(true);
    try {
      await repos.tags.update(tag.id, { name: name.trim() || tag.name });
      await onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await repos.tags.deactivate(tag.id);
      await onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <TextField label={tag.tagType} value={name} onChangeText={setName} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()} style={{ flex: 1 }}>
          Save
        </PrimaryButton>
        <PrimaryButton onPress={remove} loading={saving} tone="ghost" style={{ width: 112 }}>
          Remove
        </PrimaryButton>
      </View>
      {tag.color ? <Txt color={colors.muted} style={{ fontSize: 12 }}>Color: {tag.color}</Txt> : null}
    </Card>
  );
}
