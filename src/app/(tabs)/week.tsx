import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui/Screen';
import { Press } from '@/components/ui/Press';
import { Icon } from '@/components/ui/Icon';
import { WeekStrip } from '@/components/WeekStrip';
import { useToday } from '@/hooks/useToday';
import { activeActivities, minutesOn, weekMarks, weekResult, weeklyStreak } from '@/logic/day';
import { formatDuration, weekDays } from '@/logic/time';
import { activityColor, color, type } from '@/theme';

/**
 * Milestone 1 version of Week: where each activity stands this week.
 * The weekly statement, planning and Day Off come in milestone 2.
 */
export default function Week() {
  const { data, minute, day } = useToday();
  if (!data || !day) return null;
  const activities = activeActivities(data);
  const days = weekDays(day, data.settings.statementDay);
  const total = activities.reduce((sum, a) => sum + days.reduce((s, d) => s + minutesOn(data, d, a.id, minute), 0), 0);

  return (
    <Screen title="This week" eyebrow={`${formatDuration(total)} on what matters`}>
      <View style={{ gap: 12 }}>
        {activities.map((a) => {
          const w = weekResult(data, a, day, minute);
          const streak = weeklyStreak(data, a, day, minute);
          const tint = activityColor[a.color];
          return (
            <Press key={a.id} scaleTo={0.98} onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}>
              <Card style={{ gap: 14 }}>
                <View style={styles.top}>
                  <View style={[styles.dot, { backgroundColor: tint }]} />
                  <Text style={styles.name}>{a.name}</Text>
                  {streak > 0 ? (
                    <View style={styles.streak}>
                      <Icon name="flame" size={14} color={color.green} />
                      <Text style={styles.streakText}>{streak} wk</Text>
                    </View>
                  ) : null}
                </View>
                <WeekStrip marks={weekMarks(data, a, day, minute)} tint={tint} />
                <Text style={[styles.sub, w.met && { color: color.green }]}>
                  {w.met ? `Week done · ${w.done} of ${w.target} days` : `${w.done} of ${w.target} days · ${a.dailyTarget} min a day`}
                </Text>
              </Card>
            </Press>
          );
        })}
      </View>
      <Text style={styles.soon}>Your weekly statement, rest-day planning and Day Off arrive here next.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { ...type.body16Semi, color: color.text, flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.greenSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  streakText: { ...type.body12Semi, color: color.green },
  sub: { ...type.body13, color: color.textSecondary },
  soon: { ...type.body13, color: color.textSecondary, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
});
