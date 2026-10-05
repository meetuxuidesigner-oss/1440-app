import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/circles/Avatar';
import { KudosButton } from '@/components/circles/KudosButton';
import { MemberCard } from '@/components/circles/MemberCard';
import { PrivacyNote } from '@/components/circles/ShareChooser';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Press } from '@/components/ui/Press';
import { SectionLabel } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { friendlyError } from '@/social/api';
import { momentsOf } from '@/social/snapshot';
import { useSocial } from '@/social/store';
import { kudosTarget, MAX_MEMBERS } from '@/social/types';
import { color, radius, type } from '@/theme';

export default function CircleDetail() {
  const { id, invite } = useLocalSearchParams<{ id: string; invite?: string }>();
  const insets = useSafeAreaInsets();
  const me = useSocial((s) => s.me);
  const circle = useSocial((s) => s.circles.find((c) => c.id === id));
  const loading = useSocial((s) => s.loading);
  const refresh = useSocial((s) => s.refresh);
  const toggleKudos = useSocial((s) => s.toggleKudos);
  const leave = useSocial((s) => s.leave);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!circle || !me) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}>
        <SheetHeader title="Circle" back />
        <Text style={styles.p}>{loading ? 'Loading…' : 'This circle isn’t available any more.'}</Text>
      </View>
    );
  }

  const others = circle.members.filter((m) => m.id !== me.id);
  const meMember = circle.members.find((m) => m.id === me.id);
  const moments = momentsOf(circle, me.id).slice(0, 3);
  const showInvite = invite === '1' || others.length === 0;

  const shareInvite = () =>
    Share.share({
      message: `Join my circle "${circle.name}" on 1440. We cheer each other's steady weeks, no minutes shared.\n\nOpen 1440 → Circles → Join with a code: ${circle.inviteCode}\n\napp1440://join?code=${circle.inviteCode}`,
    }).catch(() => {});

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.textSecondary} />}>
      <SheetHeader title="" back />
      <View style={styles.hero}>
        <Text style={styles.title}>{circle.name}</Text>
        <View style={styles.people}>
          {circle.members.map((m) => (
            <Avatar key={m.id} id={m.id} name={m.name} size={32} />
          ))}
        </View>
        <Text style={styles.p}>
          {circle.members.length} of {MAX_MEMBERS} people
        </Text>
      </View>

      {showInvite ? (
        <View style={styles.invite}>
          <Text style={styles.inviteTitle}>{others.length === 0 ? 'Invite a friend or two' : 'Invite more friends'}</Text>
          <Text style={styles.p}>They open 1440, go to Circles, tap Join and type this code:</Text>
          <Text style={styles.code} selectable accessibilityLabel={`Invite code ${circle.inviteCode.split('').join(' ')}`}>
            {circle.inviteCode}
          </Text>
          <Button label="Share invite" onPress={shareInvite} />
        </View>
      ) : null}

      {moments.length > 0 ? (
        <>
          <SectionLabel>This week</SectionLabel>
          <View style={styles.moments}>
            {moments.map((m, i) => {
              const target = kudosTarget(m.activity.id, m.week);
              const kudos = circle.kudos.filter((k) => k.to === m.member.id && k.target === target);
              return (
                <View key={m.key} style={[styles.moment, i > 0 && styles.sep]}>
                  <Avatar id={m.member.id} name={m.member.name} size={30} />
                  <Text style={styles.momentText}>{m.text}</Text>
                  <KudosButton
                    sent={kudos.some((k) => k.from === me.id)}
                    count={kudos.length}
                    label={m.text}
                    onPress={() => toggleKudos(circle.id, m.member.id, target)}
                  />
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionLabel>Everyone’s week</SectionLabel>
      <View style={{ gap: 12 }}>
        {meMember ? <MemberCard circle={circle} member={meMember} meId={me.id} onKudos={() => {}} /> : null}
        {others.map((m) => (
          <MemberCard key={m.id} circle={circle} member={m} meId={me.id} onKudos={(to, target) => toggleKudos(circle.id, to, target)} />
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <PrivacyNote />
      </View>

      <View style={{ gap: 10, marginTop: 20 }}>
        <Press
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/circle-share', params: { id: circle.id } })}
          style={styles.row}>
          <Icon name="lock" size={18} color={color.text} />
          <Text style={styles.rowText}>Change what this circle sees</Text>
          <Icon name="chevron" size={16} color={color.textSecondary} />
        </Press>
        {!showInvite ? (
          <Press accessibilityRole="button" onPress={shareInvite} style={styles.row}>
            <Icon name="share" size={18} color={color.text} />
            <Text style={styles.rowText}>Invite · code {circle.inviteCode}</Text>
            <Icon name="chevron" size={16} color={color.textSecondary} />
          </Press>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          kind="danger"
          label={confirmLeave ? 'Tap again to leave' : 'Leave circle'}
          onPress={async () => {
            if (!confirmLeave) return setConfirmLeave(true);
            try {
              await leave(circle.id);
              router.back();
            } catch (e) {
              setError(friendlyError(e));
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  hero: { alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 },
  title: { ...type.heading32, fontSize: 28, lineHeight: 34, color: color.text, textAlign: 'center' },
  people: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  p: { ...type.body14, color: color.textSecondary },
  invite: { marginTop: 16, padding: 20, gap: 10, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: 'rgba(54,214,94,0.35)' },
  inviteTitle: { ...type.heading20, color: color.text },
  code: { ...type.heading32, color: color.green, letterSpacing: 8, textAlign: 'center', marginVertical: 6, fontVariant: ['tabular-nums'] },
  moments: { backgroundColor: color.surface1, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: 14 },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sep: { borderTopWidth: 1, borderTopColor: color.hairline },
  momentText: { ...type.body14, color: color.text, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: color.hairline },
  rowText: { ...type.body15Semi, color: color.text, flex: 1 },
  error: { ...type.body14, color: color.danger },
});
