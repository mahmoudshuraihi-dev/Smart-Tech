"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { ProjectRequest, STAGES, ServiceId } from "./mock-data";

const COLLECTION = "requests";

export function subscribeToAllRequests(cb: (list: ProjectRequest[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProjectRequest));
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
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProjectRequest));
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
  const data = {
    clientId,
    serviceId,
    createdAt: now,
    stage: "received" as const,
    history: [{ stage: "received" as const, at: now }],
  };
  const ref = await addDoc(collection(db, COLLECTION), data);
  const snap = await getDoc(ref);
  return { id: ref.id, ...snap.data() } as ProjectRequest;
}
