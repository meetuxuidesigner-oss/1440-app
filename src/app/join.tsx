import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/circles/Avatar';
import { ShareChooser } from '@/components/circles/ShareChooser';
import { TextField } from '@/components/circles/TextField';
import { Button } from '@/components/ui/Button';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { activeActivities } from '@/logic/day';
import { friendlyError } from '@/social/api';
import { useSocial } from '@/social/store';
import type { CirclePreview } from '@/social/types';
import { useApp } from '@/store';
import { color, radius, type } from '@/theme';

/** Join with a 6-letter code (or an invite link that fills it in). See who's there before you share anything. */
export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>();
  const insets = useSafeAreaInsets();
  const data = useApp((s) => s.data);
  const me = useSocial((s) => s.me);
  const signIn = useSocial((s) => s.signIn);
  const preview = useSocial((s) => s.preview);
  const joinCircle = useSocial((s) => s.joinCircle);
  const circles = useSocial((s) => s.circles);
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [yourName, setYourName] = useState(me?.name ?? '');
  const [found, setFound] = useState<CirclePreview | null>(null);
  const [shared, setShared] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activities = data ? activeActivities(data) : [];

  const find = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!me) await signIn(yourName);
      const p = await preview(code);
      if (!p) setError('That code doesn’t match a circle. Check the letters and try again.');
      else if (circles.some((c) => c.id === p.id)) router.replace({ pathname: '/circle/[id]', params: { id: p.id } });
      else if (p.full) setError(`${p.name} is full. Circles stay small, 10 people at most.`);
      else setFound(p);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = await joinCircle(code, shared);
      router.replace({ pathname: '/circle/[id]', params: { id } });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <SheetHeader title="Join a circle" />
        {!found ? (
          <>
            {!me ? (
              <TextField
                label="Your first name"
                hint="This is how friends will see you. No email or password needed."
                value={yourName}
                onChangeText={setYourName}
                placeholder="e.g. Riya"
                maxLength={40}
                autoCapitalize="words"
              />
            ) : null}
            <TextField
              label="Invite code"
              hint="6 letters and numbers, from the friend who invited you."
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.code}
            />
            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Button label="Find circle" busy={busy} disabled={code.length !== 6 || (!me && !yourName.trim())} onPress={find} />
          </>
        ) : (
          <>
            <View style={styles.preview}>
              <AvatarStack people={found.members.map((n, i) => ({ id: `${found.id}${i}`, name: n }))} size={36} />
              <Text style={styles.h1}>{found.name}</Text>
              <Text style={styles.p}>
                {found.owner} invited you · {found.members.join(', ')}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.h2}>What can they see?</Text>
              <Text style={styles.p}>Everything starts private. You can change this any time.</Text>
            </View>
            <ShareChooser activities={activities} value={shared} onChange={setShared} />
            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Button label={`Join ${found.name}`} busy={busy} onPress={join} />
            <Button kind="ghost" label="Not now" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 20 },
  code: { letterSpacing: 6, textAlign: 'center', fontSize: 22 },
  preview: { alignItems: 'center', gap: 8, padding: 20, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: color.hairline },
  h1: { ...type.heading24, color: color.text, textAlign: 'center' },
  h2: { ...type.heading20, color: color.text },
  p: { ...type.body15, color: color.textSecondary },
  error: { padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,107,91,0.10)' },
  errorText: { ...type.body14, color: color.danger },
});
