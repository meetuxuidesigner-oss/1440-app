import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityForm, isDraftValid, type ActivityDraft } from '@/components/ActivityForm';
import { DaySphere } from '@/components/sphere/DaySphere';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TimeStepper } from '@/components/TimeStepper';
import { Press } from '@/components/ui/Press';
import { tap } from '@/lib/haptics';
import type { DailyFill } from '@/logic/day';
import { DEFAULT_SETTINGS } from '@/logic/sample';
import { awakeMinutes, formatDuration } from '@/logic/time';
import type { Settings } from '@/logic/types';
import { useApp } from '@/store';
import { color, type } from '@/theme';

const DEMO: DailyFill = {
  day: '',
  state: 'filling',
  wellSpent: 95,
  target: 105,
  fraction: 0.9,
  layers: [
    { activityId: 'a', color: 'sky', minutes: 30, fraction: 30 / 105 },
    { activityId: 'b', color: 'coral', minutes: 45, fraction: 45 / 105 },
    { activityId: 'c', color: 'amber', minutes: 20, fraction: 20 / 105 },
  ],
  included: [],
};

const emptyFill = (target: number): DailyFill => ({ day: '', state: 'empty', wellSpent: 0, target, fraction: 0, layers: [], included: [] });

export default function Onboarding() {
  const finishOnboarding = useApp((s) => s.finishOnboarding);
  const loadSampleWeek = useApp((s) => s.loadSampleWeek);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<ActivityDraft>({ name: '', color: 'sky', dailyTarget: 30, daysPerWeek: 5 });
  const sphere = Math.min(width - 48, height * 0.42, 340);
  const awake = awakeMinutes(settings);

  const next = () => {
    tap();
    setStep((s) => s + 1);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, minHeight: height }]}
        keyboardShouldPersistTaps="handled">
        {step > 0 ? (
          <View style={styles.top}>
            <Press accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStep((s) => s - 1)} style={styles.back}>
              <Icon name="back" size={20} />
            </Press>
            <View style={styles.dots}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
              ))}
            </View>
            <View style={{ width: 40 }} />
          </View>
        ) : null}

        <Animated.View key={step} entering={FadeIn.duration(260)} exiting={FadeOut.duration(120)} style={{ flex: 1, gap: 20 }}>
          {step === 0 ? (
            <>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <DaySphere size={sphere} fill={DEMO} settings={settings} />
                <Text style={styles.brand}>1440</Text>
                <Text style={styles.lead}>Fill your day with what matters.{'\n'}Then stop. That’s the win.</Text>
              </View>
              <Button label="Get started" onPress={next} />
              <Button
                kind="ghost"
                label="Try with a sample week"
                onPress={() => {
                  loadSampleWeek();
                  router.replace('/');
                }}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.h1}>When does your day run?</Text>
              <Text style={styles.p}>Your day starts when you wake. Time while you sleep never counts, so rest is part of the plan.</Text>
              <View style={{ alignItems: 'center' }}>
                <DaySphere
                  size={Math.min(sphere, 280)}
                  fill={emptyFill(0)}
                  settings={settings}
                  now={0}
                  center={
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.awake}>{formatDuration(awake)}</Text>
                      <Text style={styles.p}>awake</Text>
                    </View>
                  }
                />
              </View>
              <View style={styles.times}>
                <TimeStepper label="Wake" value={settings.wake} onChange={(wake) => setSettings({ ...settings, wake })} />
                <TimeStepper label="Sleep" value={settings.sleep} onChange={(sleep) => setSettings({ ...settings, sleep })} />
              </View>
              {awake < 12 * 60 ? <Text style={styles.warn}>That’s a short day. Double-check your times.</Text> : null}
              <View style={{ flex: 1 }} />
              <Button label="Continue" onPress={next} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.h1}>What matters to you?</Text>
              <Text style={styles.p}>Start with one thing. Its daily target is how much it fills your sphere. You can add more later.</Text>
              <ActivityForm value={draft} onChange={setDraft} />
              <View style={{ flex: 1 }} />
              <Button label="Continue" disabled={!isDraftValid(draft)} onPress={next} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <DaySphere size={sphere} fill={emptyFill(draft.dailyTarget)} settings={settings} />
                <Text style={styles.h1Center}>Your full day: {formatDuration(draft.dailyTarget)}</Text>
                <Text style={[styles.p, { textAlign: 'center' }]}>
                  Do {draft.name.trim() || 'it'} and watch the sphere fill. When it’s full, you’re done for today. More isn’t better, steady is.
                </Text>
              </View>
              <Button
                label="Start my day"
                onPress={() => {
                  finishOnboarding(settings, [{ ...draft, name: draft.name.trim() }]);
                  router.replace('/');
                }}
              />
            </>
          ) : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { paddingHorizontal: 20, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface2, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: color.surface3 },
  dotOn: { backgroundColor: color.green },
  brand: { ...type.heading32, color: color.text, letterSpacing: 2 },
  lead: { ...type.body16, color: color.textSecondary, textAlign: 'center' },
  h1: { ...type.heading32, fontSize: 28, lineHeight: 34, color: color.text },
  h1Center: { ...type.heading24, color: color.text, textAlign: 'center' },
  p: { ...type.body15, color: color.textSecondary },
  awake: { ...type.heading32, color: color.text },
  times: { flexDirection: 'row', gap: 12 },
  warn: { ...type.body13, color: color.textSecondary, textAlign: 'center' },
});
