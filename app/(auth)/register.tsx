// app/(auth)/register.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";

// Registration screen allowing users to create an account
  export default function RegisterScreen() {
    const { register } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Handle registration form submission
    async function handleRegister() {
      if (submitting) return;
      setSubmitting(true);
      setError(null);

      console.log("REGISTER screen: calling register()");

      // Try to register the user
      try {
        const res = await register(email, password, displayName);
        console.log("REGISTER screen: result", res);

        // Check result
        if (res.ok) {
          Alert.alert("Success", "Account created!");
        } else {
          setError(res.error ?? "Registration failed");
        }
      } catch (err) {
        console.log("REGISTER screen: unexpected error", err);
        setError("Something went wrong");
      } finally {
        // Always reset submitting state
        setSubmitting(false);
        console.log("REGISTER screen: setSubmitting(false)");
      }
    }

    // Render the registration form
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Create account (minimal test)</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleRegister}
          disabled={submitting}
          style={[styles.button, submitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Creating account..." : "Create account"}
          </Text>
        </Pressable>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  error: {
    color: "crimson",
    textAlign: "center",
    marginBottom: 8,
  },
});
