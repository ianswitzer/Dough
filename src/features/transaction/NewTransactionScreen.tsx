import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  AsyncBoundary,
  CategoryDot,
  Header,
  PrimaryButton,
  Screen,
  Segmented,
  TextField,
  Txt,
} from '../../components/ui';
import type { Account, Category, TxnType } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { todayIso } from '../../lib/date';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';

// Manual transaction entry (spec §11.3 "Add transactions as I go"). Amount is
// entered in dollars; sign is derived from the expense/income toggle.
export function NewTransactionScreen() {
  const router = useRouter();
  const repos = useRepositories();
  const { data, loading, error } = useAsync(async () => {
    const [accounts, categories] = await Promise.all([repos.accounts.list(), repos.categories.list()]);
    return { accounts, categories };
  }, []);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Transactions" />
      <Header title="Add transaction" />
      <AsyncBoundary loading={loading} error={error}>
        {data ? <Form accounts={data.accounts} categories={data.categories} onSaved={() => router.back()} /> : null}
      </AsyncBoundary>
    </Screen>
  );
}

function Form({
  accounts,
  categories,
  onSaved,
}: {
  accounts: Account[];
  categories: Category[];
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxnType>('expense');
  const [accountId, setAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dollars = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const valid = merchant.trim() !== '' && accountId !== null && Number.isFinite(dollars) && dollars > 0;

  if (accounts.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 14, alignItems: 'center' }}>
        <Txt color={colors.muted} style={{ textAlign: 'center', lineHeight: 20 }}>
          Add an account first so this transaction has somewhere to live.
        </Txt>
      </View>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const cents = Math.round(dollars * 100);
      await repos.transactions.create({
        accountId: accountId!,
        categoryId,
        date: todayIso(),
        merchant: merchant.trim(),
        // Expense positive, income negative (signed ledger).
        amountCents: type === 'income' ? -cents : cents,
        type,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add transaction');
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 }}>
      {children}
    </Txt>
  );

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      <TextField label="Merchant" value={merchant} onChangeText={setMerchant} placeholder="e.g. Trader Joe's" />
      <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

      <View style={{ gap: 6 }}>
        <Label>Type</Label>
        <Segmented
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          value={type}
          onChange={setType}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Label>Account</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {accounts.map((a) => {
            const on = accountId === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setAccountId(a.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: on ? colors.ink : colors.surface,
                  borderWidth: 0.5,
                  borderColor: on ? colors.ink : colors.hairline2,
                }}
              >
                <Txt variant="medium" color={on ? colors.onInk : colors.ink2} style={{ fontSize: 13 }}>
                  {a.name}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <Label>Category</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((c) => {
            const on = categoryId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(on ? null : c.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: on ? colors.ink : colors.surface,
                  borderWidth: 0.5,
                  borderColor: on ? colors.ink : colors.hairline2,
                }}
              >
                <CategoryDot name={c.name} tintKey={c.tint} size={18} />
                <Txt color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                  {c.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <Txt color={colors.roseInk} style={{ fontSize: 13, paddingHorizontal: 4 }}>
          {error}
        </Txt>
      ) : null}
      <PrimaryButton onPress={save} loading={saving} disabled={!valid}>
        Add transaction
      </PrimaryButton>
    </View>
  );
}
