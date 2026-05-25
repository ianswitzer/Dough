import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AsyncBoundary, Card, Header, Icons, Screen, Txt } from '../../components/ui';
import type { ReviewItem } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { ReviewBadge } from '../shared/ReviewBadge';

// Review inbox (spec §11.10): one-tap approve / snooze / dismiss. Items leave
// the list optimistically; an "All clear" empty state rewards reaching zero.
export function ReviewInboxScreen() {
  const repos = useRepositories();
  const { data, loading, error } = useAsync(() => repos.review.listOpen(), []);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const act = (item: ReviewItem, status: ReviewItem['status']) => {
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    setDone((d) => d + 1);
    repos.review.setStatus(item.id, status).catch(() => {});
  };

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Today" />
      <Header subtitle={`${items.length} to review · ${done} done`} title="Review inbox" />
      <AsyncBoundary loading={loading} error={error}>
        {items.length === 0 ? <AllClear /> : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {items.map((r) => (
              <ReviewCard key={r.id} item={r} onAct={(s) => act(r, s)} />
            ))}
          </View>
        )}
      </AsyncBoundary>
    </Screen>
  );
}

function AllClear() {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 30, alignItems: 'center' }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icons.check color={colors.sageInk} size={26} />
      </View>
      <Txt variant="display" style={{ fontSize: 22 }}>All clear.</Txt>
      <Txt color={colors.muted} style={{ fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
        Nice work. We&apos;ll surface new things to look at as they come in.
      </Txt>
    </View>
  );
}

function ReviewCard({ item, onAct }: { item: ReviewItem; onAct: (status: ReviewItem['status']) => void }) {
  const { colors, radius } = useTheme();
  const primaryLabel =
    item.kind === 'unusual_charge'
      ? 'Looks fine'
      : item.kind === 'recurring_candidate' || item.kind === 'subscription_increase'
        ? 'Track it'
        : item.kind === 'duplicate_possible'
          ? 'Compare'
          : 'Approve';

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <ReviewBadge kind={item.kind} />
        <View style={{ flex: 1 }}>
          <Txt variant="display" style={{ fontSize: 18, lineHeight: 23, letterSpacing: -0.1 }}>
            {item.title}
          </Txt>
          <Txt color={colors.muted} style={{ fontSize: 12.5, marginTop: 3 }}>
            {item.body}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pressable
          onPress={() => onAct('completed')}
          style={{ flex: 1, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center' }}
        >
          <Txt variant="medium" color={colors.onInk} style={{ fontSize: 13.5 }}>{primaryLabel}</Txt>
        </Pressable>
        <Pressable
          onPress={() => onAct('snoozed')}
          style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.hairline2 }}
        >
          <Txt variant="medium" color={colors.ink2} style={{ fontSize: 13.5 }}>Snooze</Txt>
        </Pressable>
        <Pressable
          onPress={() => onAct('dismissed')}
          style={{ width: 44, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.hairline2, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icons.close color={colors.muted} />
        </Pressable>
      </View>
    </Card>
  );
}
