"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

// admin-only: builds a {uid: displayName} map of every client account, replacing the old
// static CLIENT_DIRECTORY built from hardcoded DEMO_ACCOUNTS. Real students each pick one
// free-text name at signup rather than a curated bilingual pair, so this is just a lookup.
export function useClientDirectory(): Record<string, string> {
  const [directory, setDirectory] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "client"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const next: Record<string, string> = {};
      snap.forEach((doc) => {
        next[doc.id] = (doc.data().name as string) ?? doc.id;
      });
      setDirectory(next);
    });
    return unsubscribe;
  }, []);

  return directory;
}

export function getClientName(directory: Record<string, string>, clientId: string): string {
  return directory[clientId] ?? clientId;
}
