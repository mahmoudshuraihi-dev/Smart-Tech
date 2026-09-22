import { randomUUID } from "crypto";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase-admin";
import { normalizePhone, isPlausiblePhone } from "@/lib/phone";

// Despite living under the same "admin" API folder as delete-user, this route is callable by
// any freshly-authenticated user about their OWN phone number, not just admins — a student
// claiming a pending import isn't a privileged action, it's just something the client SDK can't
// do (pendingImports is fully admin-gated in firestore.rules; this route uses the Admin SDK to
// read it on the caller's behalf instead of relaxing that rule).

interface StoredMessage {
  senderId: string;
  senderRole: "client" | "admin";
  text?: string;
  sentAt: string;
  attachment?: {
    name: string;
    kind: "image" | "file";
    mimeType: string;
    url: string;
    storagePath: string;
    size: number;
  };
}

async function regenerateDownloadUrl(bucketName: string, filePath: string): Promise<string> {
  const token = randomUUID();
  const file = getStorage(getAdminApp()).bucket().file(filePath);
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    return Response.json({ error: "missing token" }, { status: 401 });
  }

  const adminApp = getAdminApp();
  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);

  let callerUid: string;
  try {
    callerUid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return Response.json({ error: "invalid token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? normalizePhone(body.phone) : "";
  if (!isPlausiblePhone(phone)) {
    return Response.json({ error: "missing phone" }, { status: 400 });
  }

  const pendingRef = db.collection("pendingImports").doc(phone);
  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) {
    return Response.json({ imported: false });
  }

  const messagesSnap = await pendingRef.collection("messages").get();
  const bucket = getStorage(adminApp).bucket();

  const migrated: StoredMessage[] = [];
  for (const doc of messagesSnap.docs) {
    const data = doc.data() as StoredMessage;
    if (data.attachment) {
      const oldPath = data.attachment.storagePath;
      const fileName = oldPath.split("/").pop();
      const newPath = `chat-attachments/${callerUid}/${fileName}`;
      try {
        await bucket.file(oldPath).move(newPath);
        const url = await regenerateDownloadUrl(bucket.name, newPath);
        data.attachment = { ...data.attachment, storagePath: newPath, url };
      } catch {
        // the file object is missing/already moved — keep the message, drop the broken attachment
        delete data.attachment;
      }
    }
    if (data.senderRole === "client") data.senderId = callerUid;
    migrated.push(data);
  }

  if (migrated.length > 0) {
    const messagesCollection = db.collection("conversations").doc(callerUid).collection("messages");
    for (let i = 0; i < migrated.length; i += 500) {
      const batch = db.batch();
      migrated.slice(i, i + 500).forEach((m) => batch.set(messagesCollection.doc(), m));
      await batch.commit();
    }

    const latest = migrated.reduce((max, m) => (m.sentAt > max.sentAt ? m : max), migrated[0]);
    const conversationRef = db.collection("conversations").doc(callerUid);
    const conversationSnap = await conversationRef.get();
    const now = new Date().toISOString();
    if (conversationSnap.exists) {
      await conversationRef.update({
        lastMessageAt: latest.sentAt,
        lastMessagePreview: latest.text ?? latest.attachment?.name ?? "",
      });
    } else {
      await conversationRef.set({
        clientId: callerUid,
        lastReadByClient: now,
        lastReadByAdmin: now,
        paymentStatus: "unpaid",
        lastMessageAt: latest.sentAt,
        lastMessagePreview: latest.text ?? latest.attachment?.name ?? "",
        unreadForClient: 0,
        unreadForAdmin: 0,
      });
    }
  }

  if (migrated.length > 0) {
    // Best-effort audit trail: normalizePhone is digits-only with no country-code awareness
    // (see lib/phone.ts), so two different people's numbers could in theory collide and this
    // claim could attach a stranger's private history to the wrong new account. This log lets
    // an admin later see which uid absorbed which phone's history and when, so a wrong claim
    // is at least detectable and correctable after the fact. A failure here must never block
    // the actual claim/migration above, which has already committed.
    try {
      await db.collection("pendingImportClaims").add({
        phone,
        claimedByUid: callerUid,
        messageCount: migrated.length,
        studentNameHint: pendingSnap.data()?.studentNameHint ?? null,
        claimedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  }

  await db.recursiveDelete(pendingRef);

  return Response.json({ imported: true, count: migrated.length });
}
