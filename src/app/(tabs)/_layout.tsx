import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/ui/TabBar';
import { useSocialSync } from '@/social/useSocialSync';
import { useApp } from '@/store';
import { color } from '@/theme';

export default function TabsLayout() {
  const hasData = useApp((s) => s.data !== null);
  useSocialSync();
  if (!hasData) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="week" options={{ title: 'Week' }} />
      <Tabs.Screen name="circles" options={{ title: 'Circles' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
