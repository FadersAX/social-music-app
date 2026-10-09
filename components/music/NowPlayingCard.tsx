// components/music/NowPlayingCard.tsx
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { palette, radius, space } from "@/constants/theme";
import { CurrentlyPlaying, pickImage, RecentlyPlayedItem } from "@/utils/spotifyApi";
import { Artwork } from "./ui";

// Animated equalizer bars
function EqBar({ delay, playing }: { delay: number; playing: boolean }) {
  const scale = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const native = Platform.OS !== "web";
    if (!playing) {
      Animated.timing(scale, { toValue: 0.25, duration: 200, useNativeDriver: native }).start();
      return;
    }
    const ease = Easing.inOut(Easing.quad);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 320, easing: ease, useNativeDriver: native }),
        Animated.timing(scale, { toValue: 0.3, duration: 280, easing: ease, useNativeDriver: native }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [playing, delay, scale]);
  // keep the bar anchored to the bottom while it scales
  const translateY = scale.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  return (
    <Animated.View style={[styles.eqBar, { transform: [{ translateY }, { scaleY: scale }] }]} />
  );
}

export function Equalizer({ playing }: { playing: boolean }) {
  return (
    <View style={styles.eq}>
      {[0, 150, 80, 230].map((d, i) => (
        <EqBar key={i} delay={d} playing={playing} />
      ))}
    </View>
  );
}

// Shows what's playing now, or the last played track as a fallback
export function NowPlayingCard({
  nowPlaying,
  lastPlayed,
}: {
  nowPlaying: CurrentlyPlaying | null;
  lastPlayed?: RecentlyPlayedItem;
}) {
  const track = nowPlaying?.item ?? lastPlayed?.track;
  if (!track) return null;

  const isLive = !!nowPlaying?.item;
  const playing = isLive && nowPlaying!.is_playing;
  const art = pickImage(track.album.images, 300);
  const progress =
    isLive && nowPlaying!.progress_ms != null
      ? Math.min(1, nowPlaying!.progress_ms / track.duration_ms)
      : null;

  const label = playing ? "NOW PLAYING" : isLive ? "PAUSED" : "LAST PLAYED";

  return (
    <Pressable
      onPress={() => track.external_urls?.spotify && Linking.openURL(track.external_urls.spotify)}
      style={styles.card}
    >
      {/* blurred album art as the background */}
      {art ? (
        <Image source={{ uri: art }} blurRadius={40} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />

      <View style={styles.row}>
        <Artwork uri={art} name={track.name} size={84} style={styles.art} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.labelRow}>
            <Equalizer playing={playing} />
            <Text style={[styles.label, playing && { color: palette.accent }]}>{label}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artists.map((a) => a.name).join(", ")}
          </Text>
        </View>
      </View>

      {progress != null ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: space.lg,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  overlay: { backgroundColor: "rgba(6,10,18,0.55)" },
  row: { flexDirection: "row", alignItems: "center", gap: space.lg },
  art: {
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: palette.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: palette.text, fontSize: 19, fontWeight: "800" },
  artist: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "500" },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: space.lg,
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: palette.accent, borderRadius: 2 },
  eq: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 16 },
  eqBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: palette.accent },
});
