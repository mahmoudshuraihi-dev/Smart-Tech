import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase-admin";

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

  // this is the entire access-control boundary for the endpoint — checked before anything else
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (callerDoc.data()?.role !== "admin") {
    return Response.json({ error: "not an admin" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetUid = body?.uid;
  if (typeof targetUid !== "string" || !targetUid) {
    return Response.json({ error: "missing uid" }, { status: 400 });
  }
  if (targetUid === callerUid) {
    return Response.json({ error: "cannot delete your own admin account" }, { status: 400 });
  }

  try {
    const bucket = getStorage(adminApp).bucket();
    await bucket.deleteFiles({ prefix: `chat-attachments/${targetUid}/` }).catch(() => {});

    await db.recursiveDelete(db.collection("conversations").doc(targetUid));

    const requestsSnap = await db.collection("requests").where("clientId", "==", targetUid).get();
    if (!requestsSnap.empty) {
      const batch = db.batch();
      requestsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await db.collection("users").doc(targetUid).delete();

    // deleted last: if anything above throws, the account stays reachable instead of being
    // orphaned with a working login and no data
    await auth.deleteUser(targetUid);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "delete failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
