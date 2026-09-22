"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { ProjectRequest, STAGES, ServiceId } from "./mock-data";

const COLLECTION = "requests";

// createdAt is written with serverTimestamp() so requests from different students' devices
// sort correctly regardless of any single device's clock — see lib/chat-store.ts's toIso for
// the same pattern applied to chat ordering, which is where this defect was first found.
function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function subscribeToAllRequests(cb: (list: ProjectRequest[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: toIso(data.createdAt) } as ProjectRequest;
      }),
    );
  });
}

export function subscribeToRequestsForClient(
  clientId: string,
  cb: (list: ProjectRequest[]) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: toIso(data.createdAt) } as ProjectRequest;
      }),
    );
  });
}

export async function advanceStage(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data() as ProjectRequest;
    const stageIdx = STAGES.indexOf(current.stage);
    if (stageIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[stageIdx + 1];
    tx.update(ref, {
      stage: nextStage,
      history: [...current.history, { stage: nextStage, at: new Date().toISOString() }],
    });
  });
}

export async function attachFile(id: string, fileName: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    file: { name: fileName, uploadedAt: new Date().toISOString() },
  });
}

export async function createRequest(clientId: string, serviceId: ServiceId): Promise<ProjectRequest> {
  const now = new Date().toISOString();
  const history = [{ stage: "received" as const, at: now }];
  const ref = await addDoc(collection(db, COLLECTION), {
    clientId,
    serviceId,
    createdAt: serverTimestamp(),
    stage: "received" as const,
    history,
  });
  return { id: ref.id, clientId, serviceId, createdAt: now, stage: "received", history };
}
