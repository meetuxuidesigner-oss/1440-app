import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/circles/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Press } from '@/components/ui/Press';
import { momentsOf } from '@/social/snapshot';
import { useSocial } from '@/social/store';
import { useNow } from '@/store';
import { MAX_MEMBERS } from '@/social/types';
import { color, radius, type } from '@/theme';

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="circles" size={30} color={color.green} />
      </View>
      <Text style={styles.emptyTitle}>1440 is better with a few friends</Text>
      <Text style={styles.emptyBody}>
        A circle is a small private group, up to {MAX_MEMBERS} people. Cheer each other on with one tap. No feeds, no leaderboards.
      </Text>
      <View style={styles.rules}>
        <View style={styles.rule}>
          <Icon name="check" size={16} color={color.green} />
          <Text style={styles.ruleText}>Friends see which days you kept your activity, and your streak</Text>
        </View>
        <View style={styles.rule}>
          <Icon name="lock" size={16} color={color.textSecondary} />
          <Text style={styles.ruleText}>Never your minutes, and only the activities you choose</Text>
        </View>
      </View>
    </View>
  );
}

export default function Circles() {
  const insets = useSafeAreaInsets();
  const me = useSocial((s) => s.me);
  const circles = useSocial((s) => s.circles);
  const loading = useSocial((s) => s.loading);
  const error = useSocial((s) => s.error);
  const refresh = useSocial((s) => s.refresh);

  const now = useNow(60_000);
  const kudosThisWeek = me
    ? circles.flatMap((c) => c.kudos).filter((k) => k.to === me.id && now - new Date(k.createdAt).getTime() < 7 * 864e5).length
    : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.textSecondary} />}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Circles
        </Text>
        {circles.length > 0 ? (
          <Press accessibilityRole="button" accessibilityLabel="Create a circle" onPress={() => router.push('/circle-new')} style={styles.iconButton}>
            <Icon name="plus" size={22} />
          </Press>
        ) : null}
      </View>

      {error ? (
        <Press onPress={() => useSocial.getState().clearError()} style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </Press>
      ) : null}

      {circles.length === 0 ? (
        <>
          <Empty />
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button label="Create a circle" onPress={() => router.push('/circle-new')} />
            <Button kind="secondary" label="Join with a code" onPress={() => router.push('/join')} />
          </View>
        </>
      ) : (
        <View style={{ gap: 12 }}>
          {kudosThisWeek > 0 ? (
            <View style={styles.kudos}>
              <Icon name="sparkle" size={18} filled color={color.green} />
              <Text style={styles.kudosText}>
                {kudosThisWeek} kudos from friends this week
              </Text>
            </View>
          ) : null}
          {circles.map((c) => {
            const moment = momentsOf(c, me?.id)[0];
            return (
              <Press
                key={c.id}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${c.members.length} people`}
                onPress={() => router.push({ pathname: '/circle/[id]', params: { id: c.id } })}
                style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Icon name="chevron" size={18} color={color.textSecondary} />
                </View>
                <View style={styles.cardMid}>
                  <AvatarStack people={c.members} />
                  <Text style={styles.count}>
                    {c.members.length} {c.members.length === 1 ? 'person' : 'people'}
                  </Text>
                </View>
                <Text style={styles.moment} numberOfLines={2}>
                  {moment ? moment.text : c.members.length === 1 ? 'Just you so far. Invite a friend or two.' : 'Quiet week so far.'}
                </Text>
              </Press>
            );
          })}
          <Button kind="ghost" label="Join with a code" onPress={() => router.push('/join')} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 16, minHeight: 48 },
  title: { ...type.heading32, color: color.text },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.glassStroke, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,107,91,0.10)', marginBottom: 12 },
  errorText: { ...type.body14, color: color.danger },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: color.greenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { ...type.heading24, color: color.text, textAlign: 'center' },
  emptyBody: { ...type.body15, color: color.textSecondary, textAlign: 'center' },
  rules: { alignSelf: 'stretch', gap: 12, marginTop: 14, padding: 16, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: color.hairline },
  rule: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ruleText: { ...type.body14, color: color.text, flex: 1 },
  kudos: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: color.greenSoft },
  kudosText: { ...type.body14Medium, color: color.green },
  card: { backgroundColor: color.surface1, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { ...type.heading20, color: color.text, flex: 1 },
  cardMid: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { ...type.body13, color: color.textSecondary },
  moment: { ...type.body14, color: color.textSecondary },
});
