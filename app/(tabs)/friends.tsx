// app/(tabs)/friends.tsx
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { FriendCandidate, useFriends } from "@/context/FriendsContext";
import { palette, radius, space, type } from "@/constants/theme";
import {
  Artwork,
  Card,
  EmptyState,
  formatMinutes,
  Reveal,
  Screen,
  SectionHeader,
} from "@/components/music/ui";

// one line describing a user's Spotify summary, if they've shared one
function summary(c: FriendCandidate) {
  if (!c.topArtist) return "Hasn't connected Spotify yet";
  const mins = c.minutesThisWeek != null ? ` · ${formatMinutes(c.minutesThisWeek)} this week` : "";
  return `Into ${c.topArtist}${mins}`;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const myId = user?.uid ?? "";
  const email = user?.email ?? "Unknown";

  const {
    friends, // friends a user has
    requests, // requests that a user recieves
    candidates, // list of real users which can be added
    sendRequest, // allows me to send a friend request
    acceptRequest, // accept friend request
    declineRequest, // decline friend request
  } = useFriends();

  const [query, setQuery] = useState(""); //the search text

  // ids which requests are being sent
  const pendingIds = useMemo(
    () =>
      new Set(
        requests
          .filter((r) => r.fromId === myId)
          .map((r) => r.targetId)
      ),
    [requests, myId]
  );

  // requests I’ve received
  const incoming = useMemo(
    () => requests.filter((r) => r.targetId === myId),
    [requests, myId]
  );

  // people I can search for (real users from Firestore)
  const filteredCandidates = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return candidates;
    return candidates.filter((c) =>
      c.displayName.toLowerCase().includes(lower)
    );
  }, [candidates, query]);

  function handleSendRequest(targetId: string) {
    if (!myId) return; // not logged in yet
    if (pendingIds.has(targetId)) return; // already sent
    sendRequest(myId, targetId);
  }

  function renderIncoming(reqId: string) {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return null;

    const from = candidates.find((c) => c.id === req.fromId);
    const name = from?.displayName ?? "Someone";

    return (
      <View key={req.id} style={styles.row}>
        <Artwork name={name} size={44} round />
        <Text style={[styles.name, { flex: 1 }]}>{name} sent you a request</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={styles.chip} onPress={() => acceptRequest(req.id)}>
            <Text style={styles.chipText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.chipSecondary} onPress={() => declineRequest(req.id)}>
            <Text style={styles.chipSecondaryText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // this is the request button
  function renderCandidate(item: FriendCandidate) {
    const alreadyFriend = friends.some((f) => f.id === item.id);
    const isPending = pendingIds.has(item.id);

    let label = "Add";
    if (alreadyFriend) label = "Friends";
    else if (isPending) label = "Pending";

    return (
      <View key={item.id} style={styles.row}>
        <Artwork uri={item.topArtistImage} name={item.displayName} size={44} round />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
          <Text style={styles.muted} numberOfLines={1}>{summary(item)}</Text>
        </View>

        <Pressable
          style={[styles.chip, (alreadyFriend || isPending) && styles.chipDisabled]}
          disabled={alreadyFriend || isPending || !myId}
          onPress={() => handleSendRequest(item.id)}
        >
          {label === "Add" ? <Ionicons name="person-add" size={13} color="#000" /> : null}
          <Text style={[styles.chipText, label !== "Add" && { color: palette.textDim }]}>
            {label}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Screen glow={[palette.accent5, palette.accent]}>
      <Reveal index={0}>
        <Text style={styles.header}>Friends</Text>
        <Text style={styles.subtitle}>Logged in as {email}</Text>
      </Reveal>

      {/* Requests section */}
      {incoming.length > 0 ? (
        <Reveal index={1}>
          <Card style={{ borderColor: palette.accent }}>
            <SectionHeader title="Friend requests" subtitle={`${incoming.length} waiting`} />
            {incoming.map((r) => renderIncoming(r.id))}
          </Card>
        </Reveal>
      ) : null}

      {/* Friends list */}
      <Reveal index={2}>
        <Card>
          <SectionHeader title="Your friends" subtitle={`${friends.length} total`} />
          {friends.length === 0 ? (
            <EmptyState icon="people" text="You haven't added any friends yet." />
          ) : (
            friends.map((f) => (
              <View key={f.id} style={styles.row}>
                <Artwork uri={f.topArtistImage} name={f.displayName} size={44} round />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{f.displayName}</Text>
                  <Text style={styles.muted} numberOfLines={1}>{summary(f)}</Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </Reveal>

      {/* how i can search for users */}
      <Reveal index={3}>
        <Card>
          <SectionHeader title="Find people" />
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={palette.textMuted} />
            <TextInput
              placeholder="Search by name..."
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* list of users i can send friend requests to */}
          {filteredCandidates.map(renderCandidate)}
          {filteredCandidates.length === 0 ? (
            <EmptyState icon="search" text="No one found." />
          ) : null}
        </Card>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { color: palette.text, ...type.hero, marginTop: space.sm },
  subtitle: { color: palette.textDim, marginTop: 2 },
  muted: { color: palette.textDim, fontSize: 13, marginTop: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 8,
  },
  name: { color: palette.text, fontSize: 15, fontWeight: "700" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  input: { flex: 1, color: palette.text, paddingVertical: 11, fontSize: 15 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { color: "#000", fontSize: 13, fontWeight: "800" },
  chipDisabled: { backgroundColor: palette.surfaceAlt },
  chipSecondary: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipSecondaryText: { fontSize: 13, color: palette.textDim, fontWeight: "700" },
});
