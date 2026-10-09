// components/music/ConnectSpotifyCard.tsx
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette, radius, space } from "@/constants/theme";
import { useSpotify } from "@/context/SpotifyContext";
import { Button, Glow } from "./ui";
import { Equalizer } from "./NowPlayingCard";

// Call-to-action shown wherever stats need a Spotify connection
export function ConnectSpotifyCard({ compact }: { compact?: boolean }) {
  const { connectSpotify, connecting } = useSpotify();
  return (
    <View style={[styles.card, compact && { paddingVertical: space.xl }]}>
      <Glow color={palette.accent} size={320} style={{ top: -140, right: -120 }} />
      <View style={styles.iconWrap}>
        <Ionicons name="musical-notes" size={28} color="#000" />
      </View>
      <Text style={styles.title}>Unlock your stats</Text>
      <Text style={styles.body}>
        Connect Spotify to see your top artists, tracks, genres and listening habits.
      </Text>
      <View style={{ marginVertical: space.md }}>
        <Equalizer playing />
      </View>
      <Button
        label="Connect Spotify"
        icon="link"
        onPress={connectSpotify}
        loading={connecting}
        style={{ alignSelf: "stretch" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(34,211,238,0.35)",
    padding: space.xl,
    paddingVertical: space.xxl,
    alignItems: "center",
    overflow: "hidden",
    gap: space.sm,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  title: { color: palette.text, fontSize: 22, fontWeight: "800" },
  body: { color: palette.textDim, textAlign: "center", lineHeight: 20 },
});
