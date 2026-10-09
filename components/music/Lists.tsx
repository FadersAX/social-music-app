// components/music/Lists.tsx
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { accents, palette, space } from "@/constants/theme";
import { pickImage, SpotifyArtist, SpotifyTrack } from "@/utils/spotifyApi";
import { Artwork } from "./ui";

function open(url?: string) {
  if (url) Linking.openURL(url);
}

// Horizontal carousel of round artist portraits with rank badges
export function ArtistCarousel({ artists }: { artists: SpotifyArtist[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.lg, paddingRight: space.lg }}
      style={{ marginHorizontal: -space.lg, paddingLeft: space.lg }}
    >
      {artists.map((a, i) => {
        const big = i === 0;
        const size = big ? 128 : 96;
        return (
          <Pressable key={a.id} onPress={() => open(a.external_urls?.spotify)} style={styles.artist}>
            <View>
              <Artwork
                uri={pickImage(a.images, size * 2)}
                name={a.name}
                size={size}
                round
                style={big ? styles.crown : undefined}
              />
              <View style={[styles.badge, { backgroundColor: accents[i % accents.length] }]}>
                <Text style={styles.badgeText}>{i + 1}</Text>
              </View>
            </View>
            <Text style={[styles.artistName, { maxWidth: size + 8 }]} numberOfLines={1}>
              {a.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function TrackRow({ track, rank }: { track: SpotifyTrack; rank: number }) {
  return (
    <Pressable
      onPress={() => open(track.external_urls?.spotify)}
      style={({ pressed }) => [styles.track, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.rank, rank <= 3 && { color: palette.accent }]}>{rank}</Text>
      <Artwork uri={pickImage(track.album.images, 64)} name={track.album.name} size={48} />
      <View style={{ flex: 1 }}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artists.map((a) => a.name).join(", ")}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
    </Pressable>
  );
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// "5 min ago" style labels
export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  artist: { alignItems: "center", gap: space.sm, justifyContent: "flex-end" },
  crown: { borderWidth: 3, borderColor: palette.accent },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: palette.bg,
  },
  badgeText: { color: "#000", fontWeight: "900", fontSize: 12 },
  artistName: { color: palette.text, fontWeight: "700", fontSize: 13 },

  track: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6 },
  rank: {
    width: 22,
    textAlign: "center",
    color: palette.textMuted,
    fontWeight: "800",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  trackTitle: { color: palette.text, fontWeight: "700", fontSize: 15 },
  trackArtist: { color: palette.textDim, fontSize: 13, marginTop: 2 },
  duration: { color: palette.textMuted, fontVariant: ["tabular-nums"], fontSize: 12 },
});
