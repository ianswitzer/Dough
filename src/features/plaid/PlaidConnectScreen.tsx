import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { create, open, type LinkSuccess, type LinkExit } from 'react-native-plaid-link-sdk';

import { Card, Header, PrimaryButton, Screen, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

// Full Plaid Link flow. Tokens are brokered through the server-side Edge
// Functions (repos.plaid); the Plaid secret + access_token never touch the
// client. Requires a custom dev build — the native Link module does not run in
// Expo Go (see CLAUDE.md / README "Plaid").
export function PlaidConnectScreen() {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const connect = async () => {
    setBusy(true);
    setMessage(null);
    try {
      // 1. Server mints a short-lived Link token.
      const linkToken = await repos.plaid.createLinkToken();
      // 2. Hand it to the native Link module and open the flow.
      create({ token: linkToken });
      open({ onSuccess, onExit });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start Plaid Link');
      setBusy(false);
    }
  };

  const onSuccess = async (success: LinkSuccess) => {
    try {
      // 3. Server exchanges the public token, maps accounts, runs first sync.
      const result = await repos.plaid.exchangePublicToken({
        publicToken: success.publicToken,
        institution: success.metadata.institution
          ? { id: success.metadata.institution.id, name: success.metadata.institution.name }
          : undefined,
      });
      setDone(true);
      const { added } = result.synced;
      setMessage(`Connected ${result.accounts} account${result.accounts === 1 ? '' : 's'} · imported ${added} transaction${added === 1 ? '' : 's'}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not finish connecting');
    } finally {
      setBusy(false);
    }
  };

  const onExit = (exit: LinkExit) => {
    setBusy(false);
    if (exit.error) setMessage(exit.error.errorMessage ?? 'Link was cancelled');
  };

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Connect a bank" subtitle="Secure sync via Plaid" />
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Card style={{ gap: 10 }}>
          <Txt variant="display" style={{ fontSize: 22 }}>Link your accounts.</Txt>
          <Txt color={colors.muted} style={{ fontSize: 13, lineHeight: 20 }}>
            Dough connects through Plaid. You log in to your bank in Plaid's secure flow — Dough never sees your bank credentials, and access tokens stay on the server.
          </Txt>
        </Card>

        {done ? (
          <PrimaryButton onPress={() => router.back()}>Done</PrimaryButton>
        ) : (
          <PrimaryButton onPress={connect} loading={busy}>Connect with Plaid</PrimaryButton>
        )}

        {message ? (
          <Txt color={done ? colors.sageInk : colors.roseInk} style={{ fontSize: 13, lineHeight: 19, paddingHorizontal: 4 }}>
            {message}
          </Txt>
        ) : null}

        <Txt color={colors.muted} style={{ fontSize: 12, lineHeight: 18, paddingHorizontal: 4 }}>
          Requires a custom dev build (the native Plaid module does not run in Expo Go).
        </Txt>
      </View>
    </Screen>
  );
}
