import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";

// TEMPORARY QA-only endpoint — not part of the app's real feature set. Lets the one-time-use
// token holder promote a disposable test account to admin (for manually testing the admin
// dashboard on production) or fully delete a test account afterward. Deleted from the codebase
// immediately after this QA pass.
const ONE_TIME_TOKEN = "dbf7fb6bc53a4b039b7064f85fb34745";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const action = url.searchParams.get("action");
  const email = url.searchParams.get("email");
  if (!email) return Response.json({ error: "missing email" }, { status: 400 });

  const app = getAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    const user = await auth.getUserByEmail(email);

    if (action === "promote") {
      await db.collection("users").doc(user.uid).update({ role: "admin" });
      return Response.json({ ok: true, uid: user.uid, role: "admin" });
    }

    if (action === "delete") {
      await db.recursiveDelete(db.collection("conversations").doc(user.uid));
      const requestsSnap = await db.collection("requests").where("clientId", "==", user.uid).get();
      const batch = db.batch();
      requestsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      await db.collection("users").doc(user.uid).delete();
      await auth.deleteUser(user.uid);
      return Response.json({ ok: true, deleted: user.uid });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
