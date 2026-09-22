"use client";

import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { ChatMessage } from "./mock-data";

const COLLECTION = "pendingImports";
const BATCH_LIMIT = 500;

export interface PendingImportSummary {
  phone: string;
  studentNameHint: string;
  meSender: string;
  messageCount: number;
  createdAt: string;
}

function messagesCollection(phone: string) {
  return collection(db, COLLECTION, phone, "messages");
}

export async function savePendingImport(
  phone: string,
  studentNameHint: string,
  meSender: string,
  messages: Omit<ChatMessage, "id" | "conversationId">[],
): Promise<number> {
  await setDoc(doc(db, COLLECTION, phone), {
    phone,
    studentNameHint,
    meSender,
    messageCount: messages.length,
    createdAt: new Date().toISOString(),
  });

  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    messages.slice(i, i + BATCH_LIMIT).forEach((m) => {
      const msgRef = doc(messagesCollection(phone));
      const msgData: Record<string, unknown> = {
        senderId: m.senderId,
        senderRole: m.senderRole,
        sentAt: m.sentAt,
      };
      if (m.text) msgData.text = m.text;
      if (m.attachment) msgData.attachment = m.attachment;
      batch.set(msgRef, msgData);
    });
    await batch.commit();
  }

  return messages.length;
}

export async function listPendingImports(): Promise<PendingImportSummary[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as PendingImportSummary)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
