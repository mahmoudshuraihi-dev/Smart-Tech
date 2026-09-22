"use client";

import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { ChatAttachment, ChatMessage, ChatRole, Conversation, PaymentStatus } from "./mock-data";

const CONVERSATIONS = "conversations";
const BATCH_LIMIT = 500;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// sort-relevant timestamps are written with serverTimestamp() so ordering across different
// devices is authoritative (Firestore's server clock), never a possibly-skewed client clock —
// this converts the resulting Timestamp back to the ISO string shape the rest of the app
// expects. A still-pending write reads back as null for a brief instant before the server
// confirms it; old data written before this existed is already a plain ISO string.
function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function conversationRef(id: string) {
  return doc(db, CONVERSATIONS, id);
}

function messagesCollection(conversationId: string) {
  return collection(db, CONVERSATIONS, conversationId, "messages");
}

export function subscribeToConversation(id: string, cb: (c: Conversation | null) => void): () => void {
  return onSnapshot(conversationRef(id), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    cb({ id: snap.id, ...data, lastMessageAt: toIso(data.lastMessageAt) } as Conversation);
  });
}

export function subscribeToAllConversations(cb: (list: Conversation[]) => void): () => void {
  const q = query(collection(db, CONVERSATIONS), orderBy("lastMessageAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, lastMessageAt: toIso(data.lastMessageAt) } as Conversation;
      }),
    );
  });
}

export async function getOrCreateClientConversation(clientId: string): Promise<Conversation> {
  const ref = conversationRef(clientId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    return { id: snap.id, ...data, lastMessageAt: toIso(data.lastMessageAt) } as Conversation;
  }

  const now = new Date().toISOString();
  const conv = {
    clientId,
    lastReadByClient: now,
    lastReadByAdmin: now,
    paymentStatus: "unpaid" as const,
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: "",
    unreadForClient: 0,
    unreadForAdmin: 0,
  };
  await setDoc(ref, conv);
  return { id: clientId, ...conv, lastMessageAt: now };
}

export async function setPaymentStatus(conversationId: string, status: PaymentStatus): Promise<void> {
  await updateDoc(conversationRef(conversationId), { paymentStatus: status });
}

export function subscribeToMessages(conversationId: string, cb: (msgs: ChatMessage[]) => void): () => void {
  const q = query(messagesCollection(conversationId), orderBy("sentAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, conversationId, ...data, sentAt: toIso(data.sentAt) } as ChatMessage;
      }),
    );
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: ChatRole,
  text?: string,
  attachment?: ChatAttachment,
): Promise<void> {
  const msgRef = doc(messagesCollection(conversationId));
  const batch = writeBatch(db);

  const msgData: Record<string, unknown> = { senderId, senderRole, sentAt: serverTimestamp() };
  if (text) msgData.text = text;
  if (attachment) msgData.attachment = attachment;
  batch.set(msgRef, msgData);

  const otherRoleUnreadField = senderRole === "admin" ? "unreadForClient" : "unreadForAdmin";
  batch.update(conversationRef(conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: text ?? attachment?.name ?? "",
    [otherRoleUnreadField]: increment(1),
  });

  await batch.commit();
}

export async function sendMessageWithFile(
  conversationId: string,
  senderId: string,
  senderRole: ChatRole,
  text: string | undefined,
  file: File,
): Promise<void> {
  const storagePath = `chat-attachments/${conversationId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  const attachment: ChatAttachment = {
    name: file.name,
    kind: file.type.startsWith("image/") ? "image" : "file",
    mimeType: file.type,
    url,
    storagePath,
    size: file.size,
  };

  await sendMessage(conversationId, senderId, senderRole, text, attachment);
}

export async function importMessages(
  conversationId: string,
  messages: Omit<ChatMessage, "id" | "conversationId">[],
): Promise<number> {
  if (messages.length === 0) return 0;

  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const chunk = messages.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const m of chunk) {
      const msgRef = doc(messagesCollection(conversationId));
      const msgData: Record<string, unknown> = {
        senderId: m.senderId,
        senderRole: m.senderRole,
        sentAt: m.sentAt,
      };
      if (m.text) msgData.text = m.text;
      if (m.attachment) msgData.attachment = m.attachment;
      batch.set(msgRef, msgData);
    }
    await batch.commit();
  }

  // only advance the conversation's "last message" preview if the imported history is
  // actually newer than what's already there — an import is historical backfill, not
  // necessarily the newest thing in the conversation, and it shouldn't bump unread counts
  // (the admin already knows about a chat they just imported themselves)
  const latest = messages.reduce((max, m) => (m.sentAt > max.sentAt ? m : max), messages[0]);
  const snap = await getDoc(conversationRef(conversationId));
  const currentLastMessageAt = snap.exists() ? toIso(snap.data().lastMessageAt) : null;
  if (!currentLastMessageAt || latest.sentAt > currentLastMessageAt) {
    await updateDoc(conversationRef(conversationId), {
      lastMessageAt: latest.sentAt,
      lastMessagePreview: latest.text ?? latest.attachment?.name ?? "",
    });
  }

  return messages.length;
}

export async function markRead(conversationId: string, role: ChatRole): Promise<void> {
  const now = new Date().toISOString();
  if (role === "client") {
    await updateDoc(conversationRef(conversationId), { lastReadByClient: now, unreadForClient: 0 });
  } else {
    await updateDoc(conversationRef(conversationId), { lastReadByAdmin: now, unreadForAdmin: 0 });
  }
}
