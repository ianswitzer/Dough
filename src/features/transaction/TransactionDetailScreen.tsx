import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  Icons,
  MoneyDisplay,
  PrimaryButton,
  Screen,
  Toggle,
  Txt,
} from '../../components/ui';
import type { Category, Transaction } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtDate } from '../../lib/date';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { useCategories } from '../shared/useCategories';

// Transaction detail (spec §11.4): edit category, see the unusual callout, get
// the "apply to future" teach prompt, hide from budgets, mark reviewed.
export function TransactionDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const repos = useRepositories();
  const { list: categories, byId } = useCategories();
  const { data: tx, loading, error } = useAsync(() => repos.transactions.get(id), [id]);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Transactions" />
      <AsyncBoundary loading={loading} error={error}>
        {tx ? (
          <DetailBody
            tx={tx}
            originalCategory={tx.categoryId ? byId[tx.categoryId] : undefined}
            categories={categories}
            onSaved={() => router.back()}
          />
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

function DetailBody({
  tx,
  originalCategory,
  categories,
  onSaved,
}: {
  tx: Transaction;
  originalCategory?: Category;
  categories: Category[];
  onSaved: () => void;
}) {
  const { colors, radius } = useTheme();
  const repos = useRepositories();
  const { data: allTags } = useAsync(() => repos.tags.list(), []);
  const { data: accounts } = useAsync(() => repos.accounts.list(), []);
  const [chosen, setChosen] = useState<string | null>(tx.categoryId);
  const [showPicker, setShowPicker] = useState(false);
  const [accountId, setAccountId] = useState<string>(tx.accountId);
  const [showAccounts, setShowAccounts] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hidden, setHidden] = useState(tx.isHiddenFromBudget);
  const [recurring, setRecurring] = useState(tx.isRecurringCandidate);
  const [notes, setNotes] = useState(tx.notes ?? '');
  const [merchant, setMerchant] = useState(tx.merchant);
  const [showTags, setShowTags] = useState(false);
  const [selTags, setSelTags] = useState<string[]>(tx.tagNames); // tag names
  const [saving, setSaving] = useState(false);
  const chosenCat = chosen ? categories.find((c) => c.id === chosen) : undefined;
  const categoryChanged = chosen !== tx.categoryId;
  const accountChanged = accountId !== tx.accountId;
  const tagsChanged = [...selTags].sort().join('|') !== [...tx.tagNames].sort().join('|');
  // A blank name falls back to the original; only a non-empty distinct value is a rename.
  const trimmedMerchant = merchant.trim();
  const merchantChanged = trimmedMerchant.length > 0 && trimmedMerchant !== tx.merchant;
  const chosenAccount = (accounts ?? []).find((a) => a.id === accountId);
  const recurringChanged = recurring !== tx.isRecurringCandidate;
  const changed =
    categoryChanged ||
    accountChanged ||
    merchantChanged ||
    recurringChanged ||
    hidden !== tx.isHiddenFromBudget ||
    notes.trim() !== (tx.notes ?? '') ||
    tagsChanged;
  const isIncome = tx.amountCents < 0;

  const toggleTag = (name: string) =>
    setSelTags((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));

  const save = async () => {
    setSaving(true);
    try {
      await repos.transactions.update(tx.id, {
        categoryId: chosen ?? undefined,
        isHiddenFromBudget: hidden,
        notes: notes.trim() || null,
        reviewStatus: 'reviewed',
        ...(accountChanged ? { accountId } : {}),
        ...(merchantChanged ? { descriptionClean: trimmedMerchant } : {}),
      });
      if (tagsChanged) {
        const ids = (allTags ?? []).filter((t) => selTags.includes(t.name)).map((t) => t.id);
        await repos.transactions.setTags(tx.id, ids).catch(() => {});
      }
      // Track-as-recurring (spec §11.4): promote/demote this merchant's series.
      // Run after update() so a rename has already landed on description_clean.
      if (recurringChanged) {
        const name = trimmedMerchant || tx.merchant;
        if (recurring) {
          const next = new Date(`${tx.date}T00:00:00`);
          next.setMonth(next.getMonth() + 1);
          await repos.recurring
            .track({
              merchant: name,
              categoryId: chosen,
              expectedAmountCents: tx.amountCents,
              nextExpectedDate: next.toISOString().slice(0, 10),
            })
            .catch(() => {});
        } else {
          await repos.recurring.untrack(name).catch(() => {});
        }
      }
      // Corrections create learning (spec §12.2/§14): if the user changed the
      // category and opted to remember it, persist a MerchantRule and apply it
      // to other un-reviewed charges from the same merchant.
      if (remember && categoryChanged && chosen) {
        await repos.rules
          .createFromCorrection({ merchant: tx.merchant, setCategoryId: chosen, sourceTransactionId: tx.id })
          .catch(() => {});
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <View style={{ alignItems: 'center', paddingHorizontal: 22, paddingBottom: 18 }}>
        <CategoryDot name={originalCategory?.name ?? tx.merchant} tintKey={originalCategory?.tint ?? 'muted'} size={56} />
        <Txt variant="display" style={{ fontSize: 26, marginTop: 12, letterSpacing: -0.2 }}>
          {trimmedMerchant || tx.merchant}
        </Txt>
        <View style={{ marginTop: 10 }}>
          <MoneyDisplay cents={Math.abs(tx.amountCents)} size={52} dim={isIncome} />
        </View>
        <Txt color={colors.muted} style={{ fontSize: 13, marginTop: 6 }}>
          {fmtDate(tx.date)}
        </Txt>
      </View>

      {/* Unusual callout */}
      {tx.flag === 'unusual' ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={{ backgroundColor: colors.roseSoft, borderRadius: radius.lg, padding: 12, flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.roseInk, alignItems: 'center', justifyContent: 'center' }}>
              <Txt color="#fff" variant="semibold" style={{ fontSize: 13 }}>!</Txt>
            </View>
            <Txt color={colors.roseInk} style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
              This one&apos;s much larger than your usual {tx.merchant} charge.
            </Txt>
          </View>
        </View>
      ) : null}

      {/* Editable fields */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Card padded={false}>
          <MerchantRow value={merchant} onChange={setMerchant} />
          <Pressable
            onPress={() => setShowPicker((s) => !s)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTopWidth: 0.5, borderTopColor: colors.hairline }}
          >
            <Txt color={colors.muted} style={{ fontSize: 13 }}>Category</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {chosenCat ? <CategoryDot name={chosenCat.name} tintKey={chosenCat.tint} size={22} /> : null}
              <Txt style={{ fontSize: 14 }}>{chosenCat?.name ?? 'Uncategorized'}</Txt>
              <Icons.chev color={colors.muted} opacity={0.4} />
            </View>
          </Pressable>
          {showPicker ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, backgroundColor: colors.paper2, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
              {categories.map((opt) => {
                const on = chosen === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setChosen(opt.id);
                      setShowPicker(false);
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: on ? colors.ink : colors.surface,
                      borderWidth: 0.5,
                      borderColor: on ? colors.ink : colors.hairline2,
                    }}
                  >
                    <Txt color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                      {opt.name}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Pressable
            onPress={() => setShowAccounts((s) => !s)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTopWidth: 0.5, borderTopColor: colors.hairline }}
          >
            <Txt color={colors.muted} style={{ fontSize: 13 }}>Account</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt style={{ fontSize: 14 }}>{chosenAccount?.name ?? '—'}</Txt>
              <Icons.chev color={colors.muted} opacity={0.4} />
            </View>
          </Pressable>
          {showAccounts ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, backgroundColor: colors.paper2, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
              {(accounts ?? []).map((opt) => {
                const on = accountId === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setAccountId(opt.id);
                      setShowAccounts(false);
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: on ? colors.ink : colors.surface,
                      borderWidth: 0.5,
                      borderColor: on ? colors.ink : colors.hairline2,
                    }}
                  >
                    <Txt color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                      {opt.name}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Pressable
            onPress={() => setShowTags((s) => !s)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTopWidth: 0.5, borderTopColor: colors.hairline }}
          >
            <Txt color={colors.muted} style={{ fontSize: 13 }}>Tags</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt style={{ fontSize: 14 }}>{selTags.join(', ') || 'Add tag'}</Txt>
              <Icons.chev color={colors.muted} opacity={0.4} />
            </View>
          </Pressable>
          {showTags ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, backgroundColor: colors.paper2, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
              {(allTags ?? []).map((t) => {
                const on = selTags.includes(t.name);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => toggleTag(t.name)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: on ? colors.ink : colors.surface,
                      borderWidth: 0.5,
                      borderColor: on ? colors.ink : colors.hairline2,
                    }}
                  >
                    <Txt color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12 }}>
                      {t.name}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <NotesRow value={notes} onChange={setNotes} />
        </Card>
      </View>

      {/* Teach prompt */}
      {chosen !== tx.categoryId && chosenCat ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Card style={{ backgroundColor: colors.accentSoft, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icons.recurring color={colors.accentInk} />
            <View style={{ flex: 1 }}>
              <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 13.5 }}>
                Apply to future {tx.merchant} charges?
              </Txt>
              <Txt color={colors.accentInk} style={{ fontSize: 12, marginTop: 3, opacity: 0.8 }}>
                We&apos;ll always categorize them as {chosenCat.name}.
              </Txt>
            </View>
            <Toggle on={remember} onChange={setRemember} />
          </Card>
        </View>
      ) : null}

      {/* Track as recurring + hide from budgets */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Card padded={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Txt color={colors.ink2} style={{ fontSize: 13.5 }}>Track as recurring</Txt>
              <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                Add {trimmedMerchant || tx.merchant} to your recurring bills.
              </Txt>
            </View>
            <Toggle on={recurring} onChange={setRecurring} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
            <Txt color={colors.ink2} style={{ fontSize: 13.5 }}>Hide from budgets</Txt>
            <Toggle on={hidden} onChange={setHidden} />
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <PrimaryButton onPress={save} loading={saving}>
          {changed ? 'Save changes' : 'Mark reviewed'}
        </PrimaryButton>
      </View>
    </>
  );
}

// Editable merchant name: renames the transaction by setting descriptionClean
// (the resolved display name is clean || raw), saved with the other edits.
function MerchantRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
      <Txt color={colors.muted} style={{ fontSize: 13, width: 64 }}>Name</Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Merchant name"
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
        style={{ flex: 1, textAlign: 'right', fontFamily: fonts.ui, fontSize: 14, color: colors.ink, padding: 0 }}
      />
    </View>
  );
}

// Editable notes row: inline TextInput so a note can be added/edited and saved
// with the rest of the corrections.
function NotesRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
      <Txt color={colors.muted} style={{ fontSize: 13, width: 64 }}>Notes</Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Tap to add a note…"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, textAlign: 'right', fontFamily: fonts.ui, fontSize: 14, color: colors.ink, padding: 0 }}
      />
    </View>
  );
}

