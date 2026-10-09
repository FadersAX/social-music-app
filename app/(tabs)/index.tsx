// app/(tabs)/index.tsx
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useSpotify } from "@/context/SpotifyContext";
import { useStats } from "@/context/StatsContext";
import { palette, radius, space, type } from "@/constants/theme";
import {
  Artwork,
  Card,
  EmptyState,
  formatMinutes,
  Reveal,
  Screen,
  SectionHeader,
  StatTile,
} from "@/components/music/ui";
import { NowPlayingCard } from "@/components/music/NowPlayingCard";
import { RangeTabs, RANGE_LABELS } from "@/components/music/RangeTabs";
import { ArtistCarousel, timeAgo, TrackRow } from "@/components/music/Lists";
import { ConnectSpotifyCard } from "@/components/music/ConnectSpotifyCard";
import { pickImage } from "@/utils/spotifyApi";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// normalises spaces and text for more reliable matching
const normalise = (str: string) => str.toLowerCase().replace(/\s+/g, " ").trim();

export default function HomeScreen() {
  const { user } = useAuth();
  const { connected, restoring, profile } = useSpotify();
  const stats = useStats();
  const [query, setQuery] = useState(""); // what the user types into the search bar

  const name = profile?.display_name ?? user?.displayName ?? "there";

  // filters artists by name when the user searches
  const artists = useMemo(() => {
    const q = normalise(query);
    if (!q) return stats.topArtists.slice(0, 10);
    return stats.topArtists.filter((a) => normalise(a.name).includes(q));
  }, [query, stats.topArtists]);

  const uniqueArtists = useMemo(
    () => new Set(stats.recent.map((p) => p.track.artists[0]?.id)).size,
    [stats.recent]
  );

  return (
    <Screen refreshing={stats.loading && connected} onRefresh={connected ? stats.refresh : undefined}>
      {/* Header */}
      <Reveal index={0} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>{greeting()},</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name} 👋
          </Text>
        </View>
        <Artwork uri={pickImage(profile?.images, 80)} name={name} size={48} round />
      </Reveal>

      {restoring ? (
        <ActivityIndicator color={palette.accent} style={{ marginTop: 60 }} />
      ) : !connected ? (
        <Reveal index={1}>
          <ConnectSpotifyCard />
        </Reveal>
      ) : (
        <>
          {stats.error ? (
            <Card style={styles.error}>
              <Ionicons name="warning" size={18} color={palette.danger} />
              <Text style={{ color: palette.text, flex: 1 }}>{stats.error}</Text>
            </Card>
          ) : null}

          <Reveal index={1}>
            <NowPlayingCard nowPlaying={stats.nowPlaying} lastPlayed={stats.recent[0]} />
          </Reveal>

          {/* Quick stats */}
          <Reveal index={2} style={styles.tiles}>
            <StatTile icon="time" value={formatMinutes(stats.minutesThisWeek)} label="This week" />
            <StatTile
              icon="headset"
              value={String(stats.recent.length)}
              label="Recent plays"
              color={palette.accent2}
            />
            <StatTile
              icon="people"
              value={String(uniqueArtists)}
              label="Artists"
              color={palette.accent3}
            />
          </Reveal>

          <Reveal index={3}>
            <RangeTabs value={stats.timeRange} onChange={stats.setTimeRange} />
          </Reveal>

          {/* Top artists */}
          <Reveal index={4}>
            <SectionHeader title="Top Artists" subtitle={RANGE_LABELS[stats.timeRange]} />
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={palette.textMuted} />
              <TextInput
                placeholder="Search your top artists"
                placeholderTextColor={palette.textMuted}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
            {artists.length > 0 ? (
              <ArtistCarousel artists={artists} />
            ) : (
              <EmptyState
                icon="search"
                text={query ? `No top artists match "${query}"` : "No top artists yet"}
              />
            )}
          </Reveal>

          {/* Top tracks */}
          <Reveal index={5}>
            <Card>
              <SectionHeader title="Top Tracks" subtitle={RANGE_LABELS[stats.timeRange]} />
              {stats.topTracks.length === 0 ? (
                <EmptyState icon="musical-note" text="Listen to more music to build your top tracks." />
              ) : (
                stats.topTracks
                  .slice(0, 10)
                  .map((t, i) => <TrackRow key={t.id} track={t} rank={i + 1} />)
              )}
            </Card>
          </Reveal>

          {/* Recently played */}
          <Reveal index={6}>
            <Card>
              <SectionHeader title="Recently Played" />
              {stats.recent.slice(0, 8).map((p) => (
                <View key={p.played_at} style={styles.recentRow}>
                  <Artwork uri={pickImage(p.track.album.images, 64)} name={p.track.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {p.track.name}
                    </Text>
                    <Text style={styles.recentArtist} numberOfLines={1}>
                      {p.track.artists.map((a) => a.name).join(", ")}
                    </Text>
                  </View>
                  <Text style={styles.ago}>{timeAgo(p.played_at)}</Text>
                </View>
              ))}
              {stats.recent.length === 0 ? (
                <EmptyState icon="play-circle" text="Nothing played recently." />
              ) : null}
            </Card>
          </Reveal>
        </>
      )}
    </Screen>
  );
}

// styles
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.sm },
  greet: { color: palette.textDim, fontSize: 15, fontWeight: "600" },
  name: { color: palette.text, ...type.hero },

  tiles: { flexDirection: "row", gap: space.sm },

  error: { flexDirection: "row", gap: space.sm, alignItems: "center", borderColor: palette.danger },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  input: { flex: 1, color: palette.text, paddingVertical: 12, fontSize: 15 },

  recentRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6 },
  recentTitle: { color: palette.text, fontWeight: "700" },
  recentArtist: { color: palette.textDim, fontSize: 13, marginTop: 1 },
  ago: { color: palette.textMuted, fontSize: 12 },
});
