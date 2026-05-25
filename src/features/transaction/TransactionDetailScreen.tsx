import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

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
  const [chosen, setChosen] = useState<string | null>(tx.categoryId);
  const [showPicker, setShowPicker] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hidden, setHidden] = useState(tx.isHiddenFromBudget);
  const [saving, setSaving] = useState(false);
  const chosenCat = chosen ? categories.find((c) => c.id === chosen) : undefined;
  const changed = chosen !== tx.categoryId || hidden !== tx.isHiddenFromBudget;
  const isIncome = tx.amountCents < 0;

  const save = async () => {
    setSaving(true);
    try {
      await repos.transactions.update(tx.id, {
        categoryId: chosen ?? undefined,
        isHiddenFromBudget: hidden,
        reviewStatus: 'reviewed',
      });
      // (Spec §12.2) creating a MerchantRule from `remember` is a follow-up —
      // see TODO.md. For now the correction itself is persisted.
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
          {tx.merchant}
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
          <Pressable
            onPress={() => setShowPicker((s) => !s)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}
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
          <DetailRow label="Tags" value={tx.tagNames.join(', ') || 'Add tag'} />
          <DetailRow label="Notes" value={tx.notes ?? 'Tap to add a note…'} last />
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

      {/* Hide from budgets */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Card padded={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
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

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderTopWidth: 0.5,
        borderTopColor: colors.hairline,
      }}
    >
      <Txt color={colors.muted} style={{ fontSize: 13 }}>{label}</Txt>
      <Txt style={{ fontSize: 14, maxWidth: '60%' }} numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}
