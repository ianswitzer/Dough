import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AsyncBoundary, Header, PrimaryButton, Screen, Segmented, TextField, Txt } from '../../components/ui';
import type { Account, AccountType } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'credit_card', label: 'Credit' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
];

export function EditAccountScreen({ id }: { id: string }) {
  const router = useRouter();
  const repos = useRepositories();
  const { data, loading, error } = useAsync(() => repos.accounts.get(id), [id]);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Settings" />
      <Header title="Edit account" subtitle="Balances and account details" />
      <AsyncBoundary loading={loading} error={error}>
        {data ? <AccountForm account={data} onSaved={() => router.back()} /> : null}
      </AsyncBoundary>
    </Screen>
  );
}

function AccountForm({ account, onSaved }: { account: Account; onSaved: () => void }) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [name, setName] = useState(account.name);
  const [institution, setInstitution] = useState(account.institutionName ?? '');
  const [type, setType] = useState<AccountType>(account.type);
  const [balance, setBalance] = useState(
    account.currentBalanceCents == null ? '' : String(account.currentBalanceCents / 100),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const dollars = parseFloat(balance.replace(/[^0-9.-]/g, ''));
      await repos.accounts.update(account.id, {
        name: name.trim(),
        institutionName: institution.trim() || null,
        type,
        currentBalanceCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save account');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setSaving(true);
    setError(null);
    try {
      await repos.accounts.deactivate(account.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not deactivate account');
      setSaving(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      <TextField label="Name" value={name} onChangeText={setName} />
      <TextField label="Institution" value={institution} onChangeText={setInstitution} placeholder="Optional" />
      <View style={{ gap: 6 }}>
        <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
          Type
        </Txt>
        <Segmented options={TYPES} value={type} onChange={setType} />
      </View>
      <TextField label="Current balance" value={balance} onChangeText={setBalance} keyboardType="numbers-and-punctuation" />
      {error ? <Txt color={colors.roseInk} style={{ fontSize: 13 }}>{error}</Txt> : null}
      <PrimaryButton onPress={save} loading={saving} disabled={!name.trim()}>
        Save account
      </PrimaryButton>
      <PrimaryButton onPress={deactivate} loading={saving} tone="ghost">
        Deactivate account
      </PrimaryButton>
    </View>
  );
}
