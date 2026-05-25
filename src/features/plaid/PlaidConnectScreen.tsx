import React from 'react';
import { View } from 'react-native';

import { Card, Header, PrimaryButton, Screen, Txt } from '../../components/ui';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

export function PlaidConnectScreen() {
  const { colors } = useTheme();
  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Connect a bank" subtitle="Plaid sync foundation" />
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Card style={{ gap: 10 }}>
          <Txt variant="display" style={{ fontSize: 22 }}>Bank sync starts server-side.</Txt>
          <Txt color={colors.muted} style={{ fontSize: 13, lineHeight: 20 }}>
            Dough needs a trusted endpoint to create a Plaid link token and exchange the public token after Link succeeds. Secrets and access tokens should never live in the Expo app.
          </Txt>
        </Card>
        <Card style={{ gap: 8 }}>
          <Step n="1" text="Create Supabase Edge Function: plaid-create-link-token." />
          <Step n="2" text="Open Plaid Link with the returned link_token." />
          <Step n="3" text="Exchange public_token in plaid-exchange-public-token." />
          <Step n="4" text="Store Plaid item/account ids server-side, then sync transactions." />
        </Card>
        <PrimaryButton disabled>Connect with Plaid</PrimaryButton>
        <Txt color={colors.muted} style={{ fontSize: 12, lineHeight: 18, paddingHorizontal: 4 }}>
          The button is intentionally disabled until the Edge Functions and Plaid SDK dependency are added.
        </Txt>
      </View>
    </Screen>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Txt color={colors.accentInk} variant="medium" style={{ fontSize: 12 }}>{n}</Txt>
      </View>
      <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>{text}</Txt>
    </View>
  );
}
