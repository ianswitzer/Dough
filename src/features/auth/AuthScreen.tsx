import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { useAuth } from '../../auth/AuthProvider';
import { PrimaryButton, Txt } from '../../components/ui';
import { useTheme } from '../../theme';

// Combined sign-in / sign-up. New sign-ups land in onboarding; the DB trigger
// has already seeded their defaults by then.
export function AuthScreen() {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'up') {
        await signUp(email.trim(), password);
        router.replace('/(onboarding)');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.hairline2,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.ink,
  } as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Svg width={72} height={72} viewBox="0 0 92 92">
            <Circle cx="46" cy="46" r="42" fill={colors.accentSoft} />
            <Circle cx="46" cy="46" r="28" fill={colors.accent} opacity={0.5} />
            <Circle cx="46" cy="46" r="14" fill={colors.accent} />
          </Svg>
          <Txt variant="display" style={{ fontSize: 40, marginTop: 16, letterSpacing: -0.6 }}>
            Dough
          </Txt>
          <Txt color={colors.muted} style={{ fontSize: 14, marginTop: 4 }}>
            {mode === 'in' ? 'Welcome back.' : 'A calmer way to watch your money.'}
          </Txt>
        </View>

        <View style={{ gap: 10 }}>
          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? (
            <Txt color={colors.roseInk} style={{ fontSize: 13, paddingHorizontal: 4 }}>
              {error}
            </Txt>
          ) : null}
          <View style={{ marginTop: 6 }}>
            <PrimaryButton onPress={submit} loading={busy} disabled={!email || !password}>
              {mode === 'in' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 6 }}>
          <Txt color={colors.muted} style={{ fontSize: 13 }}>
            {mode === 'in' ? 'New here?' : 'Already have an account?'}
          </Txt>
          <Txt
            variant="medium"
            color={colors.accentInk}
            style={{ fontSize: 13 }}
            onPress={() => {
              setError(null);
              setMode(mode === 'in' ? 'up' : 'in');
            }}
          >
            {mode === 'in' ? 'Create one' : 'Sign in'}
          </Txt>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
