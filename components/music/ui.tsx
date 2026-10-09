// components/music/ui.tsx
// Small reusable building blocks for the app's dark, music-themed UI.
import { ReactNode, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { accents, palette, radius, space, type } from "@/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

// Soft radial glow made from stacked translucent circles (no native gradient lib needed)
export function Glow({
  color,
  size = 360,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const rings = 20;
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
      {Array.from({ length: rings }).map((_, i) => {
        const s = size * (1 - i / rings);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: (size - s) / 2,
              top: (size - s) / 2,
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: color,
              opacity: 0.014,
            }}
          />
        );
      })}
    </View>
  );
}

// Full-screen scrollable page with background glows
export function Screen({
  children,
  refreshing,
  onRefresh,
  glow = [palette.accent, palette.accent2],
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  glow?: [string, string];
}) {
  return (
    <View style={styles.screen}>
      <Glow color={glow[0]} size={420} style={{ top: -160, left: -140 }} />
      <Glow color={glow[1]} size={380} style={{ top: 120, right: -180 }} />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={palette.accent}
                colors={[palette.accent]}
                progressBackgroundColor={palette.surface}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Fades + slides children in, staggered by `index`
export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay: index * 70,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [index, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === "primary" ? "#000" : variant === "danger" ? palette.danger : palette.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "secondary" && styles.btnSecondary,
        variant === "danger" && styles.btnDanger,
        (pressed || disabled) && { opacity: 0.7 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function StatTile({
  icon,
  value,
  label,
  color = palette.accent,
}: {
  icon: IconName;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + "26" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// Image with a coloured initials fallback when there's no artwork
export function Artwork({
  uri,
  name,
  size,
  round,
  style,
}: {
  uri?: string;
  name: string;
  size: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const r = round ? size / 2 : Math.max(6, size * 0.12);
  if (uri) {
    return (
      <View style={[{ width: size, height: size, borderRadius: r, overflow: "hidden" }, style]}>
        <Image source={{ uri }} style={{ width: size, height: size }} />
      </View>
    );
  }
  const color = accents[hash(name) % accents.length];
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: color + "33",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ color, fontWeight: "800", fontSize: size * 0.36 }}>{initials || "?"}</Text>
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={22} color={palette.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, overflow: "hidden" },
  scroll: { padding: space.lg, paddingBottom: 120, gap: space.lg },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: space.lg,
  },

  sectionHeader: { flexDirection: "row", alignItems: "flex-end", marginBottom: space.md },
  sectionTitle: { ...type.heading, color: palette.text },
  sectionSubtitle: { color: palette.textDim, fontSize: 13, marginTop: 2 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
  },
  btnPrimary: { backgroundColor: palette.accent },
  btnSecondary: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  btnDanger: { backgroundColor: "rgba(244,63,94,0.12)" },
  btnText: { fontWeight: "800", fontSize: 15 },

  tile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: space.md,
    gap: 6,
  },
  tileIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: { color: palette.text, fontSize: 22, fontWeight: "800" },
  tileLabel: { color: palette.textDim, fontSize: 12, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: space.lg, gap: space.sm },
  emptyText: { color: palette.textMuted, textAlign: "center" },
});
