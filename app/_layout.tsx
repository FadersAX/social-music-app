// app/_layout.tsx
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { FriendsProvider } from "@/context/FriendsContext";
import SpotifyProvider from "@/context/SpotifyContext"; // ⬅️ DEFAULT IMPORT
import { StatsProvider } from "@/context/StatsContext";
import { palette } from "@/constants/theme";
import { LogBox } from "react-native";

SplashScreen.preventAutoHideAsync();

// Ignore specific log notification by message
LogBox.ignoreLogs([
  "[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null",
]);

// The app always uses its dark music theme
const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.bg,
    primary: palette.accent,
    border: palette.border,
  },
};

// Root layout wrapping the entire app with providers and theming
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  // Render the app with context providers and theming
  return (
    <AuthProvider>
      <FriendsProvider>
        <SpotifyProvider>
          <StatsProvider>
            <ThemeProvider value={appTheme}>
              <Stack screenOptions={{ contentStyle: { backgroundColor: palette.bg } }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="redirect" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </StatsProvider>
        </SpotifyProvider>
      </FriendsProvider>
    </AuthProvider>
  );
}
