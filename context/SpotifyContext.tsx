// context/SpotifyContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  refreshAsync,
  ResponseType,
  useAuthRequest,
} from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { createSpotifyApi, SpotifyApi, SpotifyUser } from "@/utils/spotifyApi";

WebBrowser.maybeCompleteAuthSession();

// Alert.alert does nothing on web, so fall back to the browser dialog there
function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}

${message}`);
  else Alert.alert(title, message);
}

// Spotify Client ID and scopes
// Add both redirect URIs in the Spotify developer dashboard:
//   myapp://redirect                  (phone / emulator)
//   http://127.0.0.1:8081/redirect    (web, `npx expo start` then press w)
const SPOTIFY_CLIENT_ID = "9e117fe3802047869271bba5d590559b";
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-read-currently-playing",
];

// Spotify OAuth endpoints (Authorization Code + PKCE, no client secret needed)
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
};

type SpotifyContextValue = {
  connected: boolean;
  connecting: boolean;
  restoring: boolean; // true while loading saved tokens on startup
  profile: SpotifyUser | null;
  api: SpotifyApi;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
};

const SpotifyContext = createContext<SpotifyContextValue | undefined>(
  undefined
);

// tokens are saved per app user so switching accounts doesn't leak Spotify access
const storageKey = (uid: string) => `spotify:tokens:${uid}`;

async function readTokens(uid: string): Promise<StoredTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch (err) {
    console.log("Spotify: could not read saved tokens", err);
    return null;
  }
}

async function writeTokens(uid: string, tokens: StoredTokens | null) {
  try {
    if (tokens) await AsyncStorage.setItem(storageKey(uid), JSON.stringify(tokens));
    else await AsyncStorage.removeItem(storageKey(uid));
  } catch (err) {
    console.log("Spotify: could not save tokens", err);
  }
}

// SpotifyProvider component to manage Spotify authentication and profile
const SpotifyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [profile, setProfile] = useState<SpotifyUser | null>(null);

  // refs so the API client always sees the latest tokens without re-creating it
  const tokensRef = useRef<StoredTokens | null>(null);
  const uidRef = useRef<string | null>(uid);
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  uidRef.current = uid;

  const redirectUri = makeRedirectUri({ scheme: "myapp", path: "redirect" });

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SCOPES,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  const setTokens = useCallback(async (tokens: StoredTokens | null) => {
    tokensRef.current = tokens;
    if (uidRef.current) await writeTokens(uidRef.current, tokens);
  }, []);

  const clearSession = useCallback(async () => {
    await setTokens(null);
    setConnected(false);
    setProfile(null);
  }, [setTokens]);

  // Returns a usable access token, refreshing it if it's about to expire
  const getToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      const current = tokensRef.current;
      if (!current) return null;

      const fresh = current.expiresAt - 60_000 > Date.now();
      if (fresh && !forceRefresh) return current.accessToken;

      // share one refresh between concurrent requests
      if (!refreshPromise.current) {
        refreshPromise.current = (async () => {
          try {
            const res = await refreshAsync(
              { clientId: SPOTIFY_CLIENT_ID, refreshToken: current.refreshToken },
              discovery
            );
            const next: StoredTokens = {
              accessToken: res.accessToken,
              // Spotify may or may not rotate the refresh token
              refreshToken: res.refreshToken ?? current.refreshToken,
              expiresAt: Date.now() + (res.expiresIn ?? 3600) * 1000,
            };
            await setTokens(next);
            return next.accessToken;
          } catch (err) {
            console.log("Spotify: token refresh failed, disconnecting", err);
            await clearSession();
            return null;
          } finally {
            refreshPromise.current = null;
          }
        })();
      }
      return refreshPromise.current;
    },
    [setTokens, clearSession]
  );

  const api = useMemo(() => createSpotifyApi(getToken), [getToken]);

  // Load the profile for the current tokens
  const loadProfile = useCallback(async () => {
    const me = await api.getMe();
    if (!me) throw new Error("Empty profile response");
    setProfile(me);
    setConnected(true);
    console.log("Connected to Spotify as", me.display_name ?? me.id);
  }, [api]);

  // Restore a saved Spotify session whenever the signed-in app user changes
  useEffect(() => {
    let cancelled = false;
    tokensRef.current = null;
    setConnected(false);
    setProfile(null);

    if (!uid) {
      setRestoring(false);
      return;
    }

    setRestoring(true);
    (async () => {
      const saved = await readTokens(uid);
      if (cancelled) return;
      if (saved) {
        tokensRef.current = saved;
        try {
          await loadProfile();
        } catch (err) {
          console.log("Spotify: saved session invalid", err);
          if (!cancelled) await clearSession();
        }
      }
      if (!cancelled) setRestoring(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, loadProfile, clearSession]);

  // Handle Spotify's response: swap the auth code for tokens
  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      setConnecting(false);
      notify(
        "Spotify",
        response.params?.error_description ??
          response.error?.message ??
          "Sign in failed."
      );
      return;
    }
    if (response.type !== "success") {
      // cancelled or dismissed
      setConnecting(false);
      return;
    }

    (async () => {
      try {
        const tokenRes = await exchangeCodeAsync(
          {
            clientId: SPOTIFY_CLIENT_ID,
            code: response.params.code,
            redirectUri,
            extraParams: { code_verifier: request?.codeVerifier ?? "" },
          },
          discovery
        );

        if (!tokenRes.refreshToken) {
          throw new Error("Spotify did not return a refresh token");
        }

        await setTokens({
          accessToken: tokenRes.accessToken,
          refreshToken: tokenRes.refreshToken,
          expiresAt: Date.now() + (tokenRes.expiresIn ?? 3600) * 1000,
        });
        await loadProfile();
      } catch (err: any) {
        console.log("Spotify token exchange error:", err);
        await clearSession();
        // 403 here usually means the account isn't on the app's allow-list
        notify(
          "Spotify error",
          err?.status === 403
            ? "This Spotify account isn't allowed to use the app yet. Add it under User Management in the Spotify developer dashboard."
            : "Something went wrong connecting to Spotify."
        );
      } finally {
        setConnecting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  // Called when you tap "Connect Spotify"
  async function connectSpotify() {
    // Spotify rejects "localhost" redirect URIs, so on web the app must run on 127.0.0.1.
    // The login popup reports back to the page that opened it, so both need the same address.
    if (Platform.OS === "web" && window.location.hostname === "localhost") {
      window.alert(
        "Spotify login only works from 127.0.0.1, not localhost. " +
          "Taking you there now - you'll need to sign in again, then tap Connect Spotify."
      );
      window.location.replace(window.location.href.replace("//localhost", "//127.0.0.1"));
      return;
    }

    if (!request) {
      notify(
        "Spotify",
        "Still setting up the login request. Please try again in a moment."
      );
      return;
    }

    try {
      setConnecting(true);
      // Opens the browser; result is handled by the useEffect above
      const result = await promptAsync();
      if (result.type !== "success") setConnecting(false);
    } catch (err) {
      setConnecting(false);
      console.log("Spotify promptAsync error:", err);
      notify("Spotify error", "Could not open the Spotify login page.");
    }
  }

  // Called to disconnect Spotify
  async function disconnectSpotify() {
    await clearSession();
  }

  // provide the context value
  return (
    <SpotifyContext.Provider
      value={{
        connected,
        connecting,
        restoring,
        profile,
        api,
        connectSpotify,
        disconnectSpotify,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export default SpotifyProvider;

// Custom hook to use the SpotifyContext
export function useSpotify() {
  const ctx = useContext(SpotifyContext);
  if (!ctx) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return ctx;
}
