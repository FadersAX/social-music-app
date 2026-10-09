// app/(auth)/login.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInputProps,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { palette, radius, space } from "@/constants/theme";
import { Button, Glow, Reveal } from "@/components/music/ui";
import { Equalizer } from "@/components/music/NowPlayingCard";

// text input with a leading icon
function Field({ icon, ...props }: TextInputProps & { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={palette.textMuted} />
      <TextInput placeholderTextColor={palette.textMuted} style={styles.input} {...props} />
    </View>
  );
}

// Login screen allowing users to sign in or register
export default function LoginScreen() {
  const { signIn, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Handle form submission for login or registration
  async function handleSubmit() {
    setError(null);
    setBusy(true);

    let res;
    if (mode === "login") {
      res = await signIn(email, password);
    } else {
      res = await register(email, password, displayName);
    }

    setBusy(false);

    if (res.ok) {
      // Go to home tab after auth
      router.replace("/");
    } else if (res.error) {
      setError(res.error);
    }
  }

  // Determine if we are in register mode
  const isRegister = mode === "register";

  // Render the login/register form
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg, overflow: "hidden" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Glow color={palette.accent} size={520} style={{ top: -200, left: -180 }} />
      <Glow color={palette.accent2} size={460} style={{ bottom: -160, right: -200 }} />

      <View style={styles.container}>
        <Reveal index={0} style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="pulse" size={34} color="#000" />
          </View>
          <Text style={styles.appName}>Wavelength</Text>
          <View style={styles.tagRow}>
            <Equalizer playing />
            <Text style={styles.tagline}>Your music, in numbers</Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.form}>
          <Text style={styles.title}>{isRegister ? "Create account" : "Welcome back"}</Text>

          {isRegister && (
            <Field
              icon="person-outline"
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}
          <Field
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.err}>{error}</Text> : null}

          <Button
            label={isRegister ? "Create account" : "Sign in"}
            onPress={handleSubmit}
            loading={busy}
            style={{ marginTop: space.sm }}
          />

          <Pressable
            onPress={() => setMode((m) => (m === "login" ? "register" : "login"))}
            style={styles.switch}
          >
            <Text style={styles.switchTxt}>
              {isRegister ? "Already have an account? " : "New here? "}
              <Text style={{ color: palette.accent, fontWeight: "800" }}>
                {isRegister ? "Log in" : "Create an account"}
              </Text>
            </Text>
          </Pressable>
        </Reveal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, justifyContent: "center", gap: space.xxl },
  brand: { alignItems: "center", gap: space.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
    marginBottom: space.sm,
  },
  appName: { color: palette.text, fontSize: 38, fontWeight: "900", letterSpacing: -1.2 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  tagline: { color: palette.textDim, fontSize: 15, fontWeight: "600" },

  form: {
    backgroundColor: "rgba(14,21,33,0.85)",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: space.xl,
    gap: space.md,
  },
  title: { color: palette.text, fontSize: 22, fontWeight: "800", marginBottom: space.xs },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
  },
  input: { flex: 1, color: palette.text, paddingVertical: 14, fontSize: 15 },
  err: { color: palette.danger, textAlign: "center", fontWeight: "600" },
  switch: { marginTop: space.xs, alignItems: "center" },
  switchTxt: { color: palette.textDim },
});
