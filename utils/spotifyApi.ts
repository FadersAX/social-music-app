// utils/spotifyApi.ts
// Typed wrapper around the Spotify Web API endpoints the app uses.

const API_BASE = "https://api.spotify.com/v1";

export type TimeRange = "short_term" | "medium_term" | "long_term";

export type SpotifyImage = { url: string; width: number | null; height: number | null };

export type SpotifyUser = {
  id: string;
  display_name: string | null;
  email?: string;
  country?: string;
  product?: string;
  images?: SpotifyImage[];
  followers?: { total: number };
  external_urls?: { spotify?: string };
};

export type SpotifyArtist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
  popularity?: number;
  external_urls?: { spotify?: string };
};

export type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  popularity?: number;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: SpotifyImage[] };
  external_urls?: { spotify?: string };
};

export type RecentlyPlayedItem = { track: SpotifyTrack; played_at: string };

export type CurrentlyPlaying = {
  is_playing: boolean;
  progress_ms: number | null;
  item: SpotifyTrack | null;
};

type Paging<T> = { items: T[] };

export class SpotifyApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Supplies a valid access token; forceRefresh is used after a 401
export type TokenGetter = (forceRefresh?: boolean) => Promise<string | null>;

export function createSpotifyApi(getToken: TokenGetter) {
  async function request<T>(path: string, retried = false): Promise<T | null> {
    const token = await getToken(retried);
    if (!token) throw new SpotifyApiError(401, "Not connected to Spotify");

    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // token expired or revoked: refresh once and try again
    if (res.status === 401 && !retried) return request<T>(path, true);

    // rate limited: wait for the time Spotify asks, then retry once
    if (res.status === 429 && !retried) {
      const wait = Number(res.headers.get("Retry-After") ?? "1");
      await new Promise((r) => setTimeout(r, Math.min(wait, 10) * 1000));
      return request<T>(path, true);
    }

    // 204 = nothing to return (e.g. nothing currently playing)
    if (res.status === 204) return null;

    if (!res.ok) {
      const body = await res.text();
      throw new SpotifyApiError(res.status, body || res.statusText);
    }
    return (await res.json()) as T;
  }

  return {
    getMe: () => request<SpotifyUser>("/me"),

    getTopArtists: async (range: TimeRange, limit = 20) =>
      (await request<Paging<SpotifyArtist>>(
        `/me/top/artists?time_range=${range}&limit=${limit}`
      ))?.items ?? [],

    getTopTracks: async (range: TimeRange, limit = 20) =>
      (await request<Paging<SpotifyTrack>>(
        `/me/top/tracks?time_range=${range}&limit=${limit}`
      ))?.items ?? [],

    // Spotify only exposes the last 50 plays
    getRecentlyPlayed: async (limit = 50) =>
      (await request<Paging<RecentlyPlayedItem>>(
        `/me/player/recently-played?limit=${limit}`
      ))?.items ?? [],

    getCurrentlyPlaying: () =>
      request<CurrentlyPlaying>("/me/player/currently-playing"),
  };
}

export type SpotifyApi = ReturnType<typeof createSpotifyApi>;

// Picks the smallest image that is still at least `min` px wide
export function pickImage(images: SpotifyImage[] | undefined, min = 160) {
  if (!images || images.length === 0) return undefined;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (sorted.find((i) => (i.width ?? 0) >= min) ?? sorted[sorted.length - 1]).url;
}
