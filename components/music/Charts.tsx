// components/music/Charts.tsx
// Lightweight charts built from plain Views.
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { palette, space } from "@/constants/theme";

// A single bar that grows into place
function GrowBar({
  fraction,
  color,
  delay,
  horizontal,
}: {
  fraction: number;
  color: string;
  delay: number;
  horizontal?: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // width/height can't use the native driver
    Animated.timing(v, { toValue: fraction, duration: 700, delay, useNativeDriver: false }).start();
  }, [fraction, delay, v]);
  const size = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <Animated.View
      style={[
        horizontal ? styles.hBar : styles.vBar,
        { backgroundColor: color },
        horizontal ? { width: size } : { height: size },
      ]}
    />
  );
}

// Vertical column chart, highlighting the biggest value
export function ColumnChart({
  values,
  labels,
  height = 120,
  color = palette.accent,
}: {
  values: number[];
  labels: string[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  return (
    <View>
      <View style={[styles.columns, { height }]}>
        {values.map((v, i) => (
          <View key={i} style={styles.column}>
            <GrowBar
              fraction={Math.max(v / max, v > 0 ? 0.04 : 0.015)}
              color={i === peak && v > 0 ? color : palette.surfaceAlt}
              delay={i * 40}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {labels.map((l, i) => (
          <Text key={i} style={[styles.label, i === peak && values[i] > 0 && { color: palette.text }]}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Horizontal labelled bars (e.g. genre shares)
export function BarList({
  items,
  colors,
}: {
  items: { label: string; value: number; display: string }[];
  colors: string[];
}) {
  const max = Math.max(0.0001, ...items.map((i) => i.value));
  return (
    <View style={{ gap: space.md }}>
      {items.map((item, i) => (
        <View key={item.label} style={{ gap: 6 }}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.barValue}>{item.display}</Text>
          </View>
          <View style={styles.hTrack}>
            <GrowBar
              horizontal
              fraction={item.value / max}
              color={colors[i % colors.length]}
              delay={i * 80}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// Circular-ish score meter drawn with a segmented ring of dots
export function ScoreRing({ score, color }: { score: number; color: string }) {
  const dots = 36;
  const size = 132;
  const r = size / 2 - 8;
  const lit = Math.round((score / 100) * dots);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: dots }).map((_, i) => {
        const a = (i / dots) * Math.PI * 2 - Math.PI / 2;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: 4,
              left: size / 2 + r * Math.cos(a) - 3.5,
              top: size / 2 + r * Math.sin(a) - 3.5,
              backgroundColor: i < lit ? color : palette.surfaceAlt,
            }}
          />
        );
      })}
      <Text style={{ color: palette.text, fontSize: 32, fontWeight: "800" }}>{score}</Text>
      <Text style={{ color: palette.textDim, fontSize: 11, fontWeight: "700" }}>/ 100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  column: { flex: 1, height: "100%", justifyContent: "flex-end" },
  vBar: { width: "100%", borderRadius: 6 },
  labels: { flexDirection: "row", marginTop: space.sm, gap: 4 },
  label: { flex: 1, textAlign: "center", color: palette.textMuted, fontSize: 11, fontWeight: "700" },

  barHeader: { flexDirection: "row", justifyContent: "space-between", gap: space.sm },
  barLabel: { color: palette.text, fontWeight: "700", textTransform: "capitalize", flex: 1 },
  barValue: { color: palette.textDim, fontWeight: "700", fontVariant: ["tabular-nums"] },
  hTrack: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: "hidden" },
  hBar: { height: 8, borderRadius: 4 },
});
