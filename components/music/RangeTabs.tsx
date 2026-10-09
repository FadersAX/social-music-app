// components/music/RangeTabs.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radius } from "@/constants/theme";
import { TimeRange } from "@/utils/spotifyApi";

export const RANGE_LABELS: Record<TimeRange, string> = {
  short_term: "4 weeks",
  medium_term: "6 months",
  long_term: "All time",
};

// Segmented control for choosing the Spotify top-items time range
export function RangeTabs({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <View style={styles.wrap}>
      {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{RANGE_LABELS[r]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
  tabActive: { backgroundColor: palette.text },
  text: { color: palette.textDim, fontWeight: "700", fontSize: 13 },
  textActive: { color: "#000" },
});
