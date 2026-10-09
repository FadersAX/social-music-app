// app/redirect.tsx
// Spotify sends the user back to myapp://redirect after login.
// expo-auth-session reads the result; this route just stops the router showing "not found".
import { Redirect } from "expo-router";

export default function SpotifyRedirect() {
  return <Redirect href="/" />;
}
