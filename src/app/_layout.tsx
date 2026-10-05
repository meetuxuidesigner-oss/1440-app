import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/ui/ToastHost';
import { useHydrated } from '@/store';
import { color } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: color.bg, card: color.surface1, text: color.text, border: color.hairline, primary: color.green },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const hydrated = useHydrated();
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="activity/[id]" />
          <Stack.Screen name="log" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 28 }} />
          <Stack.Screen name="new-activity" options={{ presentation: 'modal' }} />
          <Stack.Screen name="circle/[id]" />
          <Stack.Screen name="circle-new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="join" options={{ presentation: 'modal' }} />
          <Stack.Screen name="circle-share" options={{ presentation: 'modal' }} />
        </Stack>
        <ToastHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
