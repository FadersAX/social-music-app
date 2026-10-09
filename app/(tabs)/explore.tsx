// app/(tabs)/explore.tsx
// Insights: genres, listening habits and a few fun stats derived from Spotify data.
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSpotify } from "@/context/SpotifyContext";
import { useStats } from "@/context/StatsContext";
import { accents, palette, space, type } from "@/constants/theme";
import {
  Artwork,
  Card,
  EmptyState,
  formatMinutes,
  Reveal,
  Screen,
  SectionHeader,
} from "@/components/music/ui";
import { BarList, ColumnChart, ScoreRing } from "@/components/music/Charts";
import { RangeTabs, RANGE_LABELS } from "@/components/music/RangeTabs";
import { ConnectSpotifyCard } from "@/components/music/ConnectSpotifyCard";
import { pickImage } from "@/utils/spotifyApi";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

// what kind of listener you are, based on your busiest time of day
function listenerType(peakHour: number) {
  if (peakHour >= 5 && peakHour < 11)
    return { title: "Early Bird", icon: "sunny" as const, color: palette.accent4 };
  if (peakHour >= 11 && peakHour < 17)
    return { title: "Daytime Groover", icon: "partly-sunny" as const, color: palette.accent };
  if (peakHour >= 17 && peakHour < 22)
    return { title: "Evening Listener", icon: "cloudy-night" as const, color: palette.accent3 };
  return { title: "Night Owl", icon: "moon" as const, color: palette.accent2 };
}

function formatHour(h: number) {
  return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
}

function mainstreamLabel(score: number) {
  if (score >= 75) return "You love the hits. Your taste lines up with the charts.";
  if (score >= 55) return "A healthy mix of chart-toppers and hidden gems.";
  if (score >= 35) return "You lean underground and dig past the big names.";
  return "Deep cuts only. Your taste is truly niche.";
}

export default function InsightsScreen() {
  const { connected, restoring } = useSpotify();
  const stats = useStats();
  const [gridWidth, setGridWidth] = useState(0);

  // group 24 hours into 3-hour buckets for the chart
  const hourBuckets = useMemo(
    () =>
      Array.from({ length: 8 }, (_, b) =>
        stats.playsByHour.slice(b * 3, b * 3 + 3).reduce((a, c) => a + c, 0)
      ),
    [stats.playsByHour]
  );

  const peakHour = stats.playsByHour.indexOf(Math.max(...stats.playsByHour));
  const peakDay = stats.playsByDay.indexOf(Math.max(...stats.playsByDay));
  const persona = listenerType(peakHour);

  // unique album covers from top tracks
  const albums = useMemo(() => {
    const seen = new Set<string>();
    return stats.topTracks.filter((t) => {
      if (seen.has(t.album.id)) return false;
      seen.add(t.album.id);
      return true;
    }).slice(0, 9);
  }, [stats.topTracks]);

  const tile = Math.floor((gridWidth - space.sm * 2) / 3);
  const hasPlays = stats.recent.length > 0;

  return (
    <Screen
      refreshing={stats.loading && connected}
      onRefresh={connected ? stats.refresh : undefined}
      glow={[palette.accent2, palette.accent3]}
    >
      <Reveal index={0}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>What your listening says about you</Text>
      </Reveal>

      {restoring ? (
        <ActivityIndicator color={palette.accent} style={{ marginTop: 60 }} />
      ) : !connected ? (
        <Reveal index={1}>
          <ConnectSpotifyCard />
        </Reveal>
      ) : (
        <>
          {/* Listener persona */}
          {hasPlays ? (
            <Reveal index={1}>
              <Card style={[styles.persona, { borderColor: persona.color + "55" }]}>
                <View style={[styles.personaIcon, { backgroundColor: persona.color + "26" }]}>
                  <Ionicons name={persona.icon} size={30} color={persona.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>YOUR LISTENING TYPE</Text>
                  <Text style={styles.personaTitle}>{persona.title}</Text>
                  <Text style={styles.dim}>
                    Most active on {DAY_NAMES[peakDay]}s around{" "}
                    {formatHour(peakHour)}
                  </Text>
                </View>
              </Card>
            </Reveal>
          ) : null}

          {/* Weekly top artists by minutes */}
          <Reveal index={2}>
            <Card>
              <SectionHeader
                title="This Week"
                subtitle={`${formatMinutes(stats.minutesThisWeek)} from your recent plays`}
              />
              {stats.weeklyArtists.length === 0 ? (
                <EmptyState icon="calendar" text="No plays yet this week." />
              ) : (
                <BarList
                  colors={accents}
                  items={stats.weeklyArtists.map((a) => ({
                    label: a.name,
                    value: a.minutes,
                    display: `${a.minutes} min`,
                  }))}
                />
              )}
            </Card>
          </Reveal>

          <Reveal index={3}>
            <RangeTabs value={stats.timeRange} onChange={stats.setTimeRange} />
          </Reveal>

          {/* Mainstream score */}
          {stats.mainstreamScore != null ? (
            <Reveal index={4}>
              <Card style={styles.scoreCard}>
                <ScoreRing score={stats.mainstreamScore} color={palette.accent} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.kicker}>MAINSTREAM SCORE</Text>
                  <Text style={styles.body}>{mainstreamLabel(stats.mainstreamScore)}</Text>
                  <Text style={styles.dim}>Average popularity of your top tracks</Text>
                </View>
              </Card>
            </Reveal>
          ) : null}

          {/* Genres */}
          <Reveal index={5}>
            <Card>
              <SectionHeader title="Top Genres" subtitle={RANGE_LABELS[stats.timeRange]} />
              {stats.topGenres.length === 0 ? (
                <EmptyState icon="pricetags" text="Spotify didn't return genre data for your artists." />
              ) : (
                <BarList
                  colors={accents}
                  items={stats.topGenres.map((g) => ({
                    label: g.genre,
                    value: g.share,
                    display: `${Math.round(g.share * 100)}%`,
                  }))}
                />
              )}
            </Card>
          </Reveal>

          {/* Habits */}
          {hasPlays ? (
            <Reveal index={6}>
              <Card style={{ gap: space.xl }}>
                <View>
                  <SectionHeader title="By Day" subtitle={`Last ${stats.recent.length} plays`} />
                  <ColumnChart values={stats.playsByDay} labels={DAYS} color={palette.accent} />
                </View>
                <View>
                  <SectionHeader title="By Time of Day" />
                  <ColumnChart values={hourBuckets} labels={HOUR_LABELS} color={palette.accent2} />
                </View>
              </Card>
            </Reveal>
          ) : null}

          {/* Album wall */}
          {albums.length > 0 ? (
            <Reveal index={7}>
              <Card>
                <SectionHeader title="Album Wall" subtitle="From your top tracks" />
                <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
                  {tile > 0 && albums.map((t) => (
                    <Artwork
                      key={t.album.id}
                      uri={pickImage(t.album.images, 200)}
                      name={t.album.name}
                      size={tile}
                    />
                  ))}
                </View>
              </Card>
            </Reveal>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.text, ...type.hero, marginTop: space.sm },
  subtitle: { color: palette.textDim, fontSize: 15, marginTop: 2 },

  kicker: { color: palette.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  body: { color: palette.text, fontSize: 15, fontWeight: "600", lineHeight: 21 },
  dim: { color: palette.textDim, fontSize: 13, marginTop: 2 },

  persona: { flexDirection: "row", alignItems: "center", gap: space.lg },
  personaIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  personaTitle: { color: palette.text, ...type.title, marginTop: 2 },

  scoreCard: { flexDirection: "row", alignItems: "center", gap: space.lg },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
