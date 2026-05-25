import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Icons, PrimaryButton, Txt } from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useTheme } from '../../theme';

// 3-step first-run flow (spec §11.1). Get to first value fast: explain the
// promise, pick an import method, capture payday cadence — no budget setup.
export function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const repos = useRepositories();
  const [step, setStep] = useState(1);

  const finish = async () => {
    try {
      await repos.profile.update({ onboarded: true });
    } catch {
      // Non-fatal: the user can still use the app; flag will retry later.
    }
    router.replace('/(tabs)');
  };

  const next = () => (step < 3 ? setStep(step + 1) : finish());

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top + 10 }}>
      {/* progress dots */}
      <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'center', paddingBottom: 8 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: i === step ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === step ? colors.accentInk : colors.hairline2,
            }}
          />
        ))}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 28 }}>
        {step === 1 && <StepWelcome />}
        {step === 2 && <StepImport />}
        {step === 3 && <StepPayday />}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <PrimaryButton onPress={next}>
          {step === 1 ? 'Get started' : step === 2 ? 'Continue' : 'Build my Today'}
        </PrimaryButton>
      </View>
    </View>
  );
}

function StepWelcome() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={92} height={92} viewBox="0 0 92 92">
        <Circle cx="46" cy="46" r="42" fill={colors.accentSoft} />
        <Circle cx="46" cy="46" r="28" fill={colors.accent} opacity={0.55} />
        <Circle cx="46" cy="46" r="14" fill={colors.accent} />
      </Svg>
      <Txt variant="display" style={{ fontSize: 40, marginTop: 28, textAlign: 'center', letterSpacing: -0.6 }}>
        Welcome to Dough.
      </Txt>
      <Txt color={colors.ink2} style={{ fontSize: 15, lineHeight: 23, marginTop: 18, textAlign: 'center' }}>
        We&apos;ll show what changed, what needs review, and what you can safely spend. No
        spreadsheets. No guilt.
      </Txt>
    </View>
  );
}

const IMPORT_OPTIONS = [
  { id: 'csv', label: 'Import a CSV', sub: 'Drag a statement from any bank', tag: 'Recommended' },
  { id: 'bank', label: 'Connect my bank', sub: 'Plaid sync — coming soon', tag: 'Soon', disabled: true },
  { id: 'manual', label: 'Track manually', sub: 'Add transactions as I go' },
] as const;

function StepImport() {
  const { colors, radius } = useTheme();
  const [pick, setPick] = useState<string>('csv');
  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      <Txt variant="display" style={{ fontSize: 30, letterSpacing: -0.4 }}>
        Let&apos;s find your money.
      </Txt>
      <Txt color={colors.ink2} style={{ fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 22 }}>
        Bring in a recent statement so Today has something real to show. You can change this later.
      </Txt>
      <View style={{ gap: 10 }}>
        {IMPORT_OPTIONS.map((opt) => {
          const on = pick === opt.id;
          return (
            <Pressable
              key={opt.id}
              disabled={opt.disabled}
              onPress={() => setPick(opt.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: radius.xl,
                backgroundColor: opt.disabled ? colors.paper2 : colors.surface,
                borderWidth: 1.5,
                borderColor: on && !opt.disabled ? colors.accentInk : colors.hairline2,
                opacity: opt.disabled ? 0.55 : 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Txt variant="medium" style={{ fontSize: 15 }}>
                    {opt.label}
                  </Txt>
                  {'tag' in opt && opt.tag ? (
                    <Txt
                      variant="semibold"
                      color={opt.tag === 'Recommended' ? colors.sageInk : colors.muted}
                      style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}
                    >
                      {opt.tag}
                    </Txt>
                  ) : null}
                </View>
                <Txt color={colors.muted} style={{ fontSize: 12.5, marginTop: 3 }}>
                  {opt.sub}
                </Txt>
              </View>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 1.5,
                  borderColor: on ? colors.accentInk : colors.hairline2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentInk }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CADENCES = [
  { label: 'Every two weeks', sub: 'e.g. salaried employees' },
  { label: 'Twice a month', sub: 'e.g. the 1st and 15th' },
  { label: 'Once a month' },
  { label: 'Variable / freelance' },
];

function StepPayday() {
  const { colors, radius } = useTheme();
  const [sel, setSel] = useState(0);
  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      <Txt variant="display" style={{ fontSize: 30, letterSpacing: -0.4 }}>
        When do you usually get paid?
      </Txt>
      <Txt color={colors.ink2} style={{ fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 22 }}>
        This helps us tell you how much is safe to spend until your next payday.
      </Txt>
      <View style={{ gap: 8 }}>
        {CADENCES.map((opt, i) => {
          const on = sel === i;
          return (
            <Pressable
              key={opt.label}
              onPress={() => setSel(i)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: on ? colors.ink : colors.surface,
                borderWidth: on ? 0 : 0.5,
                borderColor: colors.hairline2,
              }}
            >
              <View>
                <Txt variant="medium" color={on ? colors.onInk : colors.ink} style={{ fontSize: 14.5 }}>
                  {opt.label}
                </Txt>
                {opt.sub ? (
                  <Txt color={on ? colors.onInk : colors.muted} style={{ fontSize: 12, marginTop: 2, opacity: on ? 0.7 : 1 }}>
                    {opt.sub}
                  </Txt>
                ) : null}
              </View>
              {on ? <Icons.check color={colors.onInk} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
