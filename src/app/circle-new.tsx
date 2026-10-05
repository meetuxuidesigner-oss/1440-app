import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShareChooser } from '@/components/circles/ShareChooser';
import { TextField } from '@/components/circles/TextField';
import { Button } from '@/components/ui/Button';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { activeActivities } from '@/logic/day';
import { friendlyError } from '@/social/api';
import { useSocial } from '@/social/store';
import { useApp } from '@/store';
import { color, radius, type } from '@/theme';

/** Create a circle: name it, choose what it sees (everything starts private), then invite. */
export default function NewCircle() {
  const insets = useSafeAreaInsets();
  const data = useApp((s) => s.data);
  const me = useSocial((s) => s.me);
  const signIn = useSocial((s) => s.signIn);
  const createCircle = useSocial((s) => s.createCircle);
  const [step, setStep] = useState(0);
  const [yourName, setYourName] = useState(me?.name ?? '');
  const [name, setName] = useState('');
  const [shared, setShared] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activities = data ? activeActivities(data) : [];

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!me) await signIn(yourName);
      const id = await createCircle(name, shared);
      router.replace({ pathname: '/circle/[id]', params: { id, invite: '1' } });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <SheetHeader title="New circle" />
        {step === 0 ? (
          <>
            {!me ? (
              <TextField
                label="Your first name"
                hint="This is how friends will see you. No email or password needed."
                value={yourName}
                onChangeText={setYourName}
                placeholder="e.g. Meet"
                maxLength={40}
                autoFocus
                autoCapitalize="words"
              />
            ) : null}
            <TextField
              label="Circle name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning learners"
              maxLength={40}
              autoFocus={!!me}
            />
            <Button label="Continue" disabled={!name.trim() || (!me && !yourName.trim())} onPress={() => setStep(1)} />
          </>
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>What can {name.trim()} see?</Text>
              <Text style={styles.p}>Everything starts private. Switch on only what you want this circle to cheer for.</Text>
            </View>
            <ShareChooser activities={activities} value={shared} onChange={setShared} />
            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Button label="Create circle" busy={busy} onPress={create} />
            <Button kind="ghost" label="Back" onPress={() => setStep(0)} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 20 },
  h1: { ...type.heading24, color: color.text },
  p: { ...type.body15, color: color.textSecondary },
  error: { padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,107,91,0.10)' },
  errorText: { ...type.body14, color: color.danger },
});
