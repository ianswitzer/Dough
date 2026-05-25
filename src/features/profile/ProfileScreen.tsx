import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function ProfileScreen() {
  const router = useRouter();
  const repos = useRepositories();
  const { data, loading, error } = useAsync(() => repos.profile.getCurrent(), []);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Your account" subtitle="Profile details" />
      <AsyncBoundary loading={loading} error={error}>
        {data ? <ProfileForm displayName={data.displayName ?? ''} email={data.email} onSaved={() => router.back()} /> : null}
      </AsyncBoundary>
    </Screen>
  );
}

function ProfileForm({
  displayName,
  email,
  onSaved,
}: {
  displayName: string;
  email: string;
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await repos.profile.update({ displayName: name.trim() || null });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      <TextField label="Display name" value={name} onChangeText={setName} placeholder="What should Dough call you?" />
      <TextField label="Email" value={email} onChangeText={() => {}} autoCapitalize="none" editable={false} />
      <Txt color={colors.muted} style={{ fontSize: 12, lineHeight: 18, paddingHorizontal: 4, marginTop: -8 }}>
        Email and password changes need a secure auth flow; this screen handles profile details for now.
      </Txt>
      {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
      <PrimaryButton onPress={save} loading={saving}>
        Save profile
      </PrimaryButton>
    </View>
  );
}
