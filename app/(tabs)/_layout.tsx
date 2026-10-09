// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { HapticTab } from "@/components/HapticTab";
import { palette } from "@/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

// filled icon when the tab is active, outline otherwise
const tabIcon =
  (name: string) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons
      name={(focused ? name : `${name}-outline`) as IconName}
      size={24}
      color={color}
    />
  );

export default function TabsLayout() {
  const { user, loading } = useAuth();

  // dont render until we know if logged in or not
  if (loading) return null;

  // if not logged in, redirect to login
  if (!user) return <Redirect href="/login" />;

  // if login is successful, show the tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(6,10,18,0.96)",
          borderTopColor: palette.border,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="explore" options={{ title: "Insights", tabBarIcon: tabIcon("pulse") }} />
      <Tabs.Screen name="friends" options={{ title: "Friends", tabBarIcon: tabIcon("people") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon("person-circle") }} />
    </Tabs>
  );
}
