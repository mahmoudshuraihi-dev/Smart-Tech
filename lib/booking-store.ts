"use client";

import { collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { BookingLead, BookingStatus } from "./mock-data";

const COLLECTION = "bookings";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

// orderBy("createdAt") is safe here (unlike requests/messages, see lib/mock-store.ts) because
// every booking doc is written exclusively by app/api/bookings/route.ts with
// FieldValue.serverTimestamp() — there's no legacy plain-string createdAt ever mixed in.
export function subscribeToBookings(cb: (list: BookingLead[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: toIso(data.createdAt) } as BookingLead;
    });
    cb(list);
  });
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status });
}
