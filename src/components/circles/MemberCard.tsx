import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { WeekStrip } from '@/components/WeekStrip';
import { addDays, dateKey, formatDayLong } from '@/logic/time';
import { kudosTarget, type Circle, type Member } from '@/social/types';
import { activityColor, color, radius, type } from '@/theme';

import { Avatar } from './Avatar';
import { KudosButton } from './KudosButton';

interface Props {
  circle: Circle;
  member: Member;
  meId: string;
  onKudos: (to: string, target: string) => void;
}

/** One person's week as the circle sees it: ✓ days and streaks, never minutes. */
export function MemberCard({ circle, member, meId, onKudos }: Props) {
  const isMe = member.id === meId;
  const snap = member.snapshot;
  const activities = snap?.activities ?? [];
  const isOwner = circle.ownerId === member.id;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar id={member.id} name={member.name} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{isMe ? `${member.name} (you)` : member.name}</Text>
          <Text style={styles.sub}>{isOwner ? 'Started this circle' : `Joined ${formatJoined(member.joinedAt)}`}</Text>
        </View>
      </View>

      {activities.length === 0 ? (
        <View style={styles.private}>
          <Icon name="lock" size={14} color={color.textSecondary} />
          <Text style={styles.privateText}>{isMe ? 'You share nothing with this circle yet.' : 'Keeps their activities private.'}</Text>
        </View>
      ) : null}

      {activities.map((a) => {
        const target = kudosTarget(a.id, snap!.week);
        const kudos = circle.kudos.filter((k) => k.to === member.id && k.target === target);
        const sent = kudos.some((k) => k.from === meId);
        const tint = activityColor[a.color];
        return (
          <View key={a.id} style={styles.activity}>
            <View style={styles.activityTop}>
              <View style={[styles.dot, { backgroundColor: tint }]} />
              <Text style={styles.activityName} numberOfLines={1}>
                {a.name}
              </Text>
              {a.streak > 0 ? (
                <View style={styles.streak}>
                  <Icon name="flame" size={12} color={color.green} />
                  <Text style={styles.streakText}>{a.streak} wk</Text>
                </View>
              ) : null}
              {isMe ? (
                kudos.length > 0 ? (
                  <View style={styles.received}>
                    <Icon name="sparkle" size={13} filled color={color.green} />
                    <Text style={styles.receivedText}>{kudos.length}</Text>
                  </View>
                ) : null
              ) : (
                <KudosButton
                  sent={sent}
                  count={kudos.length}
                  label={`${member.name}'s ${a.name}`}
                  onPress={() => onKudos(member.id, target)}
                />
              )}
            </View>
            <WeekStrip compact tint={tint} marks={a.marks.map((mark, i) => ({ day: addDays(snap!.week, i), mark }))} />
            <Text style={[styles.week, a.met && { color: color.green }]}>
              {a.met ? `Week done · ${a.done} of ${a.target} days` : `${a.done} of ${a.target} days this week`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function formatJoined(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 864e5);
  if (days < 1) return 'today';
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return formatDayLong(dateKey(d)).split(', ')[1];
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface1, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, padding: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { ...type.body16Semi, color: color.text },
  sub: { ...type.body13, color: color.textSecondary },
  private: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privateText: { ...type.body13, color: color.textSecondary },
  activity: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.hairline },
  activityTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activityName: { ...type.body15Semi, color: color.text, flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: color.greenSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  streakText: { ...type.body12Semi, color: color.green },
  received: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  receivedText: { ...type.body12Semi, color: color.green },
  week: { ...type.body13, color: color.textSecondary },
});
