// app/(tabs)/profile.tsx
import { ComponentProps } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useStats } from "@/context/StatsContext";
import { useSpotify } from "@/context/SpotifyContext";
import { accents, palette, radius, space, type } from "@/constants/theme";
import {
  Artwork,
  Button,
  Card,
  EmptyState,
  formatMinutes,
  Glow,
  Reveal,
  Screen,
  SectionHeader,
} from "@/components/music/ui";
import { ConnectSpotifyCard } from "@/components/music/ConnectSpotifyCard";
import { pickImage } from "@/utils/spotifyApi";

function Badge({ icon, label, color = palette.textDim }: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// Card showing total minutes listened this week
function MinutesCard() {
  const { minutesThisWeek, recent } = useStats();
  return (
    <Card style={styles.minutesCard}>
      <Glow color={palette.accent} size={260} style={{ top: -120, left: -60 }} />
      <Text style={styles.kicker}>MINUTES LISTENED THIS WEEK</Text>
      <Text style={styles.bigNumber}>{minutesThisWeek.toLocaleString()}</Text>
      <Text style={styles.dim}>
        That's {formatMinutes(minutesThisWeek)} across your last {recent.length} plays
      </Text>
    </Card>
  );
}

// Card showing top 5 artists this week
function TopArtists() {
  const { weeklyArtists } = useStats();
  const max = Math.max(1, ...weeklyArtists.map((a) => a.minutes));
  return (
    <Card>
      <SectionHeader title="Top 5 Artists" subtitle="This week" />
      {weeklyArtists.map((a, i) => (
        <View key={a.name} style={styles.row}>
          <Text style={[styles.rank, { color: accents[i % accents.length] }]}>{i + 1}</Text>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.rowTop}>
              <Text style={styles.name} numberOfLines={1}>{a.name}</Text>
              <Text style={styles.mins}>{a.minutes} mins</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(a.minutes / max) * 100}%`, backgroundColor: accents[i % accents.length] },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
      {weeklyArtists.length === 0 && <EmptyState icon="mic" text="No plays this week." />}
    </Card>
  );
}

// Card showing top 5 tracks this week
function TopTracks() {
  const { weeklyTracks } = useStats();
  return (
    <Card>
      <SectionHeader title="Top 5 Songs" subtitle="This week" />
      {weeklyTracks.map((t, i) => (
        <View key={`${t.artist}-${t.title}`} style={styles.row}>
          <Text style={[styles.rank, i < 3 && { color: palette.accent }]}>{i + 1}</Text>
          <Artwork uri={t.image} name={t.title} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{t.title}</Text>
            <Text style={styles.dim} numberOfLines={1}>{t.artist}</Text>
          </View>
          <Text style={styles.mins}>
            {t.plays}× · {t.minutes}m
          </Text>
        </View>
      ))}
      {weeklyTracks.length === 0 && <EmptyState icon="musical-note" text="No plays this week." />}
    </Card>
  );
}

// Profile screen showing user info and Spotify connection status
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { connected, profile, disconnectSpotify } = useSpotify();
  const { loading, refresh } = useStats();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const name = profile?.display_name ?? user?.displayName ?? "You";
  const premium = profile?.product === "premium";

  // Render the profile screen
  return (
    <Screen
      refreshing={loading && connected}
      onRefresh={connected ? refresh : undefined}
      glow={[palette.accent3, palette.accent]}
    >
      {/* Header */}
      <Reveal index={0} style={styles.header}>
        <View style={styles.avatarRing}>
          <Artwork uri={pickImage(profile?.images, 200)} name={name} size={104} round />
        </View>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.dim}>{user?.email}</Text>
        {connected && profile ? (
          <View style={styles.badges}>
            <Badge
              icon={premium ? "diamond" : "musical-notes"}
              label={premium ? "Premium" : "Free"}
              color={premium ? palette.accent : palette.textDim}
            />
            {profile.country ? <Badge icon="globe-outline" label={profile.country} /> : null}
            {profile.followers ? (
              <Badge icon="people-outline" label={`${profile.followers.total} followers`} />
            ) : null}
          </View>
        ) : null}
      </Reveal>

      {/* Spotify connection */}
      <Reveal index={1}>
        {connected && profile ? (
          <Card style={styles.spotifyCard}>
            <View style={styles.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Spotify connected</Text>
              <Text style={styles.dim}>as {profile.display_name ?? profile.id}</Text>
            </View>
            {profile.external_urls?.spotify ? (
              <Button
                label="Open"
                variant="secondary"
                onPress={() => Linking.openURL(profile.external_urls!.spotify!)}
                style={styles.smallBtn}
              />
            ) : null}
          </Card>
        ) : (
          <ConnectSpotifyCard compact />
        )}
      </Reveal>

      {connected ? (
        <>
          <Reveal index={2}><MinutesCard /></Reveal>
          <Reveal index={3}><TopArtists /></Reveal>
          <Reveal index={4}><TopTracks /></Reveal>
        </>
      ) : null}

      <Reveal index={5} style={{ gap: space.sm }}>
        {connected ? (
          <Button
            label="Disconnect Spotify"
            icon="unlink"
            variant="secondary"
            onPress={disconnectSpotify}
          />
        ) : null}
        <Button label="Sign Out" icon="log-out-outline" variant="danger" onPress={handleSignOut} />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 4, marginTop: space.lg },
  avatarRing: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: palette.accent,
    marginBottom: space.sm,
  },
  title: { color: palette.text, ...type.title },
  badges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.sm, marginTop: space.md },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },

  spotifyCard: { flexDirection: "row", alignItems: "center", gap: space.md },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.accent,
    shadowColor: palette.accent,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  smallBtn: { paddingVertical: 8, paddingHorizontal: space.lg },

  minutesCard: { overflow: "hidden" },
  kicker: { color: palette.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  bigNumber: { color: palette.text, fontSize: 56, fontWeight: "900", letterSpacing: -2 },

  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 7 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: space.sm },
  rank: { width: 20, color: palette.textMuted, fontWeight: "900", fontSize: 16, textAlign: "center" },
  name: { color: palette.text, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  mins: { fontVariant: ["tabular-nums"], color: palette.textDim, fontWeight: "600", fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: palette.surfaceAlt, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },

  dim: { color: palette.textDim, fontSize: 13 },
});
