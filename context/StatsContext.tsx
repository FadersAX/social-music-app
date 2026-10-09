// context/StatsContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { AppState } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/firebaseconfig";
import { useAuth } from "./AuthContext";
import { useSpotify } from "./SpotifyContext";
import { isInCurrentWeek } from "@/utils/week";
import {
  CurrentlyPlaying,
  pickImage,
  RecentlyPlayedItem,
  SpotifyArtist,
  SpotifyTrack,
  TimeRange,
} from "@/utils/spotifyApi";

export type ArtistStat = { name: string; minutes: number; plays: number };
export type TrackStat = {
  title: string;
  artist: string;
  minutes: number;
  plays: number;
  image?: string;
};
export type GenreStat = { genre: string; share: number };

type Stats = {
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  refresh: () => Promise<void>;

  // straight from Spotify
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  recent: RecentlyPlayedItem[];
  nowPlaying: CurrentlyPlaying | null;

  // derived from recently played (Spotify only exposes the last 50 plays)
  minutesThisWeek: number;
  weeklyArtists: ArtistStat[];
  weeklyTracks: TrackStat[];
  playsByDay: number[]; // Mon..Sun
  playsByHour: number[]; // 0..23

  // derived from top artists / tracks
  topGenres: GenreStat[];
  mainstreamScore: number | null; // average track popularity 0-100
};

const StatsContext = createContext<Stats | undefined>(undefined);

const NOW_PLAYING_POLL_MS = 30_000;

export function StatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { connected, api } = useSpotify();

  const [timeRange, setTimeRange] = useState<TimeRange>("short_term");
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [recent, setRecent] = useState<RecentlyPlayedItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNowPlaying = useCallback(async () => {
    try {
      setNowPlaying(await api.getCurrentlyPlaying());
    } catch (err) {
      console.log("Spotify now playing error", err);
    }
  }, [api]);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    try {
      const [artists, tracks, recentPlays] = await Promise.all([
        api.getTopArtists(timeRange, 20),
        api.getTopTracks(timeRange, 20),
        api.getRecentlyPlayed(50),
        loadNowPlaying(),
      ]);
      setTopArtists(artists);
      setTopTracks(tracks);
      setRecent(recentPlays);
    } catch (err: any) {
      console.log("Spotify stats error", err);
      setError("Couldn't load your Spotify stats. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, [api, connected, timeRange, loadNowPlaying]);

  // reload whenever we connect or change the time range
  useEffect(() => {
    if (connected) {
      refresh();
    } else {
      setTopArtists([]);
      setTopTracks([]);
      setRecent([]);
      setNowPlaying(null);
    }
  }, [connected, refresh]);

  // keep "now playing" fresh while the app is in the foreground
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      if (AppState.currentState === "active") loadNowPlaying();
    }, NOW_PLAYING_POLL_MS);
    return () => clearInterval(id);
  }, [connected, loadNowPlaying]);

  const derived = useMemo(() => {
    const thisWeek = recent.filter((p) => isInCurrentWeek(new Date(p.played_at)));

    // Total minutes
    const minutesThisWeek = Math.round(
      thisWeek.reduce((sum, p) => sum + p.track.duration_ms, 0) / 60000
    );

    // group by artist (first credited artist)
    const byArtist = new Map<string, ArtistStat>();
    for (const p of thisWeek) {
      const name = p.track.artists[0]?.name ?? "Unknown";
      const s = byArtist.get(name) ?? { name, minutes: 0, plays: 0 };
      s.minutes += p.track.duration_ms / 60000;
      s.plays += 1;
      byArtist.set(name, s);
    }
    const weeklyArtists = Array.from(byArtist.values())
      .map((a) => ({ ...a, minutes: Math.round(a.minutes) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // group by track
    const byTrack = new Map<string, TrackStat>();
    for (const p of thisWeek) {
      const t = p.track;
      const s = byTrack.get(t.id) ?? {
        title: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        minutes: 0,
        plays: 0,
        image: pickImage(t.album.images, 64),
      };
      s.minutes += t.duration_ms / 60000;
      s.plays += 1;
      byTrack.set(t.id, s);
    }
    const weeklyTracks = Array.from(byTrack.values())
      .map((t) => ({ ...t, minutes: Math.round(t.minutes) }))
      .sort((a, b) => b.plays - a.plays || b.minutes - a.minutes)
      .slice(0, 5);

    // listening patterns across all recent plays
    const playsByDay = Array(7).fill(0);
    const playsByHour = Array(24).fill(0);
    for (const p of recent) {
      const d = new Date(p.played_at);
      playsByDay[(d.getDay() + 6) % 7] += 1; // Monday first
      playsByHour[d.getHours()] += 1;
    }

    // genres weighted by artist rank (higher ranked artists count more)
    const genreWeights = new Map<string, number>();
    topArtists.forEach((a, i) => {
      const weight = topArtists.length - i;
      for (const g of a.genres ?? []) {
        genreWeights.set(g, (genreWeights.get(g) ?? 0) + weight);
      }
    });
    const totalWeight = Array.from(genreWeights.values()).reduce((a, b) => a + b, 0);
    const topGenres = Array.from(genreWeights.entries())
      .map(([genre, w]) => ({ genre, share: totalWeight ? w / totalWeight : 0 }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 6);

    const pops = topTracks
      .map((t) => t.popularity)
      .filter((p): p is number => typeof p === "number");
    const mainstreamScore = pops.length
      ? Math.round(pops.reduce((a, b) => a + b, 0) / pops.length)
      : null;

    return {
      minutesThisWeek,
      weeklyArtists,
      weeklyTracks,
      playsByDay,
      playsByHour,
      topGenres,
      mainstreamScore,
    };
  }, [recent, topArtists, topTracks]);

  // share a small summary on the user's profile so friends can see it
  useEffect(() => {
    // only share the 4-week view so friends always compare the same range
    if (!user?.uid || !connected || timeRange !== "short_term" || topArtists.length === 0) return;
    const top = topArtists[0];
    setDoc(
      doc(db, "users", user.uid),
      {
        spotify: {
          topArtist: top.name,
          topArtistImage: pickImage(top.images, 64) ?? null,
          minutesThisWeek: derived.minutesThisWeek,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true }
    ).catch((err) => console.log("Could not save Spotify summary", err));
  }, [user?.uid, connected, timeRange, topArtists, derived.minutesThisWeek]);

  const value: Stats = {
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh,
    topArtists,
    topTracks,
    recent,
    nowPlaying,
    ...derived,
  };

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

// Custom hook to use the StatsContext
export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error("useStats must be used within StatsProvider");
  return ctx;
}
