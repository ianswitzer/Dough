import React, { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Card, Header, PrimaryButton, Screen, TextField, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function DataPrivacyScreen() {
  const { colors } = useTheme();
  const repos = useRepositories();
  const { signOut } = useAuth();
  const [exportJson, setExportJson] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportData = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const data = await repos.dataPrivacy.exportData();
      setExportJson(JSON.stringify(data, null, 2));
      setMessage('Export ready.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not export data');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await repos.dataPrivacy.deleteAccount();
      await signOut();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not delete account');
      setBusy(false);
    }
  };

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Data & account" subtitle="Export or delete" />
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Card style={{ gap: 12 }}>
          <Txt variant="display" style={{ fontSize: 22 }}>Export your data</Txt>
          <Txt color={colors.muted} style={{ fontSize: 13, lineHeight: 20 }}>
            Creates a JSON export from the server-side data export function.
          </Txt>
          <PrimaryButton onPress={exportData} loading={busy}>Generate export</PrimaryButton>
          {exportJson ? (
            <TextField
              label="Export JSON"
              value={exportJson}
              onChangeText={setExportJson}
              autoCapitalize="none"
              multiline
              numberOfLines={8}
            />
          ) : null}
        </Card>

        <Card style={{ gap: 12 }}>
          <Txt variant="display" color={colors.roseInk} style={{ fontSize: 22 }}>Delete account</Txt>
          <Txt color={colors.muted} style={{ fontSize: 13, lineHeight: 20 }}>
            This calls a server-side function that deletes your Supabase auth user; user-scoped rows cascade from there.
          </Txt>
          <TextField label="Type DELETE" value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />
          <PrimaryButton onPress={deleteAccount} loading={busy} disabled={confirm !== 'DELETE'} tone="ghost">
            Delete account
          </PrimaryButton>
        </Card>

        {message ? <Txt color={message.includes('ready') ? colors.sageInk : colors.roseInk} style={{ fontSize: 13 }}>{message}</Txt> : null}
      </View>
    </Screen>
  );
}
