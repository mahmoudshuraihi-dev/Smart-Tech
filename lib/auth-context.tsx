"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type Role = "client" | "admin" | null;

interface Session {
  role: Role;
  id: string | null;
  emailVerified: boolean;
}

type AuthResult = { ok: true; id: string } | { ok: false; error: string };

interface AuthContextValue {
  session: Session;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  signup: (name: string, phone: string, email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(e: unknown): string {
  const code = e instanceof Error && "code" in e ? String((e as { code?: string }).code) : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "email-already-in-use";
    case "auth/weak-password":
      return "weak-password";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "invalid-credential";
    case "auth/too-many-requests":
      return "too-many-requests";
    case "auth/network-request-failed":
      return "network-request-failed";
    default:
      return "generic";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ role: null, id: null, emailVerified: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubRole: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user: User | null) => {
      unsubRole?.();
      if (!user) {
        setSession({ role: null, id: null, emailVerified: false });
        setReady(true);
        return;
      }
      // live-subscribed (not a one-off getDoc) so an admin role flip made directly in the
      // Firebase console takes effect immediately in an already-open tab, no re-login needed
      unsubRole = onSnapshot(doc(db, "users", user.uid), (snap) => {
        const role = (snap.data()?.role as Exclude<Role, null>) ?? "client";
        setSession({ role, id: user.uid, emailVerified: user.emailVerified });
        setReady(true);
      });
    });

    return () => {
      unsubAuth();
      unsubRole?.();
    };
  }, []);

  const login = async (email: string, password: string, remember = false): Promise<AuthResult> => {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return { ok: true, id: cred.user.uid };
    } catch (e) {
      return { ok: false, error: mapAuthError(e) };
    }
  };

  const signup = async (
    name: string,
    phone: string,
    email: string,
    password: string,
    remember = false,
  ): Promise<AuthResult> => {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      try {
        await sendEmailVerification(cred.user);
      } catch {
        // best-effort — signup itself must not fail just because the verification email didn't send
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        role: "client",
        name,
        phone,
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      });

      // best-effort: if this student's WhatsApp history was pre-imported by phone number before
      // they signed up, pull it into their brand-new conversation now, before we redirect them —
      // a failure here shouldn't block signup itself
      try {
        const idToken = await cred.user.getIdToken();
        await fetch("/api/admin/claim-pending-import", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ phone }),
        });
      } catch {
        // ignore — worst case the student just starts with an empty conversation
      }

      return { ok: true, id: cred.user.uid };
    } catch (e) {
      return { ok: false, error: mapAuthError(e) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resendVerification = async (): Promise<AuthResult> => {
    const user = auth.currentUser;
    if (!user) return { ok: false, error: "generic" };
    try {
      await sendEmailVerification(user);
      return { ok: true, id: user.uid };
    } catch (e) {
      return { ok: false, error: mapAuthError(e) };
    }
  };

  // Enumeration-safe: Firebase throws "auth/user-not-found" for an unregistered email, but we
  // report the same success either way so a visitor can't use this to discover which emails
  // have an account here.
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { ok: true, id: "" };
    } catch (e) {
      const code = e instanceof Error && "code" in e ? String((e as { code?: string }).code) : "";
      if (code === "auth/user-not-found") return { ok: true, id: "" };
      return { ok: false, error: mapAuthError(e) };
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, ready, login, signup, logout, resendVerification, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
