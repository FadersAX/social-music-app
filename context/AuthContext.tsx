// context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth, db } from "../firebaseconfig";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Define types for authentication results and user session
type AuthResult = {
  ok: boolean;
  error?: string;
};

// User information stored in session
export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

// Define the shape of the AuthContext
type AuthContextType = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Firebase user to session user
function mapUser(fbUser: FirebaseUser | null): SessionUser | null {
  if (!fbUser) return null;
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
  };
}

// Make sure a Firestore profile exists for this Firebase user
async function ensureUserDocument(
  fbUser: FirebaseUser,
  displayNameOverride?: string
) {
  const uid = fbUser.uid;
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);
  if (snap.exists()) {
    // already has a profile
    return;
  }

  // Create profile
  const email = fbUser.email ?? null;
  const name =
    (displayNameOverride ||
      fbUser.displayName ||
      (email ? email.split("@")[0] : "") ||
      "User"
    ).trim();

    // Create the user document in Firestore
  await setDoc(ref, {
    uid,
    email,
    displayName: name,
    createdAt: serverTimestamp(),
  });

  console.log("ensureUserDocument: profile created for", uid);
}

// Same as ensureUserDocument, but a failed write doesn't break login.
// The account already exists in Firebase Auth at this point, so just log why.
async function trySaveProfile(fbUser: FirebaseUser, displayNameOverride?: string) {
  try {
    await ensureUserDocument(fbUser, displayNameOverride);
  } catch (err: any) {
    console.warn(
      `Could not save Firestore profile for ${fbUser.uid}: ${err?.code ?? err}.` +
        (err?.code === "permission-denied"
          ? " Check your Firestore security rules allow signed-in users to write users/{uid}."
          : "")
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      console.log("AUTH onAuthStateChanged", fbUser?.uid);
      setUser(mapUser(fbUser));
      setLoading(false);
      // backfill a profile for accounts that don't have one yet
      if (fbUser) trySaveProfile(fbUser);
    });
    return unsub;
  }, []);

  // sign in existing user
  async function signIn(email: string, password: string): Promise<AuthResult> {
    console.log("AUTH signIn() start", { email });
    try {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      if (!e || !p) return { ok: false, error: "Enter email and password" };

      const cred = await signInWithEmailAndPassword(auth, e, p);

      // Make sure this user has a Firestore profile (for old accounts)
      await trySaveProfile(cred.user);

      setUser(mapUser(cred.user));
      console.log("AUTH signIn() success", cred.user.uid);
      return { ok: true };
    } catch (err: any) {
      console.log("AUTH signIn() error", err);
      let message = "Login failed";
      if (err.code === "auth/user-not-found")
        message = "No account for that email";
      else if (err.code === "auth/wrong-password")
        message = "Incorrect password";
      else if (err.code === "auth/invalid-email") message = "Invalid email";
      return { ok: false, error: message };
    }
  }

  // register new user
  async function register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResult> {
    console.log("AUTH register() start", { email, displayName });

    try {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      const name = displayName.trim();

      if (!e || !p || !name) {
        return { ok: false, error: "All fields are required" };
      }

      const cred = await createUserWithEmailAndPassword(auth, e, p);
      const fbUser = cred.user;

      // Create Firestore profile for this new user
      await trySaveProfile(fbUser, name);

      const sessionUser: SessionUser = {
        uid: fbUser.uid,
        email: fbUser.email ?? e,
        displayName: name,
      };
      setUser(sessionUser);

      console.log("AUTH register() success, session user set");
      return { ok: true };
    } catch (err: any) {
      console.log("AUTH register() error", err);
      let msg = "Registration failed";

      const code = err?.code as string | undefined;
      if (code === "auth/email-already-in-use") msg = "Email already in use";
      else if (code === "auth/invalid-email") msg = "Invalid email address";
      else if (code === "auth/weak-password") msg = "Password is too weak";

      return { ok: false, error: msg };
    }
  }

  // sign out current user
  async function signOut() {
    console.log("AUTH signOut()");
    await fbSignOut(auth);
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    register,
    signOut,
  };

  // Provide the AuthContext to children components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the AuthContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
