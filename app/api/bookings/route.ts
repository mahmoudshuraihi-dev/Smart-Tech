import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { normalizePhone } from "@/lib/phone";
import { SERVICE_IDS, type ServiceId } from "@/lib/mock-data";

// Deliberately NOT under app/api/admin/* — that namespace means "caller is an authenticated
// admin" (see delete-user/route.ts, claim-pending-import/route.ts). This route is intentionally
// public: anyone can call it with no auth, which is why it leans on Turnstile + a honeypot +
// tight server-side validation instead of a bearer token check.

const MAX_NAME_LENGTH = 80;
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json().catch(() => null);
    return data?.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return Response.json({ error: "invalid-body" }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;

  // honeypot: a real visitor never sees or fills this field (hidden off-canvas in
  // BookingForm.tsx) — a bot that fills every input gets a fake success, no write happens
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const serviceId = body.serviceId;
  const locale = body.locale === "en" ? "en" : "ar";
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (!name || name.length > MAX_NAME_LENGTH) {
    return Response.json({ error: "invalid-name" }, { status: 400 });
  }

  const phoneNormalized = normalizePhone(phoneRaw);
  if (phoneNormalized.length < MIN_PHONE_DIGITS || phoneNormalized.length > MAX_PHONE_DIGITS) {
    return Response.json({ error: "invalid-phone" }, { status: 400 });
  }

  if (typeof serviceId !== "string" || !SERVICE_IDS.includes(serviceId as ServiceId)) {
    return Response.json({ error: "invalid-service" }, { status: 400 });
  }

  if (!(await verifyTurnstile(turnstileToken))) {
    return Response.json({ error: "captcha-failed" }, { status: 400 });
  }

  try {
    const db = getFirestore(getAdminApp());
    const ref = await db.collection("bookings").add({
      name,
      phone: phoneRaw,
      phoneNormalized,
      serviceId,
      status: "new",
      locale,
      createdAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ ok: true, id: ref.id });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "write-failed" }, { status: 500 });
  }
}
