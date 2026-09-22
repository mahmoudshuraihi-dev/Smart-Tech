"use client";

import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack: string | null;
  source: string;
  url: string;
  createdAt: string;
}

export interface PendingImportClaimEntry {
  id: string;
  phone: string;
  claimedByUid: string;
  messageCount: number;
  studentNameHint: string | null;
  claimedAt: string;
}

// Ordering by createdAt as a plain string is safe here (unlike lib/request-store.ts's
// requests/messages) — every doc in both collections is written exclusively by an Admin-SDK
// API route with a fresh ISO string, never a mix of legacy string + Firestore Timestamp.
export function subscribeToErrorLogs(cb: (list: ErrorLogEntry[]) => void, max = 100): () => void {
  const q = query(collection(db, "errorLogs"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ErrorLogEntry)));
}

export async function deleteErrorLog(id: string): Promise<void> {
  await deleteDoc(doc(db, "errorLogs", id));
}

export function subscribeToPendingImportClaims(
  cb: (list: PendingImportClaimEntry[]) => void,
  max = 100,
): () => void {
  const q = query(collection(db, "pendingImportClaims"), orderBy("claimedAt", "desc"), limit(max));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PendingImportClaimEntry)),
  );
}
