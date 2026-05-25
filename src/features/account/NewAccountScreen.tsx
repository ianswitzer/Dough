import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Header, PrimaryButton, Screen, Segmented, TextField, Txt } from '../../components/ui';
import type { AccountType } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'credit_card', label: 'Credit' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
];

// Manual account creation (spec §11.11 "Accounts and imports"). Balance is
// entered in dollars and stored as integer cents.
export function NewAccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const dollars = parseFloat(balance.replace(/[^0-9.-]/g, ''));
      await repos.accounts.create({
        name: name.trim(),
        type,
        currentBalanceCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Add account" subtitle="Manual · CSV import coming soon" />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Chase Checking" />
        <View style={{ gap: 6 }}>
          <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Type
          </Txt>
          <Segmented options={TYPES} value={type} onChange={setType} />
        </View>
        <TextField
          label="Current balance"
          value={balance}
          onChangeText={setBalance}
          placeholder="0.00"
          keyboardType="numbers-and-punctuation"
        />
        {type === 'credit_card' ? (
          <Txt color={colors.muted} style={{ fontSize: 12, paddingHorizontal: 4, marginTop: -8 }}>
            For a card you owe on, enter a negative balance (e.g. −824.30).
          </Txt>
        ) : null}
        {error ? (
          <Txt color={colors.roseInk} style={{ fontSize: 13, paddingHorizontal: 4 }}>
            {error}
          </Txt>
        ) : null}
        <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()}>
          Add account
        </PrimaryButton>
      </View>
    </Screen>
  );
}
