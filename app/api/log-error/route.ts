import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";

// Deliberately public (no ID-token check) — errors can happen before a visitor is logged in
// (e.g. on the login page itself), and a broken auth flow shouldn't also break error reporting.
// Abuse mitigation is a payload-size cap + a simple in-memory rate limit instead of auth.
//
// The rate limiter is per-process (a plain module-level Map): it resets on redeploy/restart and
// won't be shared across multiple server instances if this app is ever deployed to a
// multi-instance/edge platform. Accepted trade-off to avoid adding a new dependency (e.g. Redis)
// for what is, worst case, a slightly-too-generous limit rather than an open write amplifier —
// Firestore writes still only ever go through the Admin SDK below, never a client-open rule.

const MAX_BODY_CHARS = 8000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 20;
const MAX_TOTAL = 500;

const ipHits = new Map<string, { count: number; resetAt: number }>();
let totalHits = { count: 0, resetAt: Date.now() + WINDOW_MS };

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (now > totalHits.resetAt) totalHits = { count: 0, resetAt: now + WINDOW_MS };
  totalHits.count++;
  if (totalHits.count > MAX_TOTAL) return true;

  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_IP;
}

function truncate(v: unknown, max: number): string | null {
  return typeof v === "string" ? v.slice(0, max) : null;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }

  const body = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  if (!body || typeof body.message !== "string") {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const db = getFirestore(getAdminApp());
    await db.collection("errorLogs").add({
      message: truncate(body.message, 2000) ?? "",
      stack: truncate(body.stack, 4000),
      digest: truncate(body.digest, 200),
      source: truncate(body.source, 40) ?? "manual",
      url: truncate(body.url, 500) ?? "",
      userAgent: truncate(body.userAgent, 300) ?? "",
      ip,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // swallow — a broken logging pipeline must never surface as a user-visible error
  }

  return Response.json({ ok: true });
}
