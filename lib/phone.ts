// Shared by the admin's bulk WhatsApp pre-import upload and the student signup form — the only
// identifier a not-yet-existing student account and a WhatsApp export have in common. Digits
// only: a deliberate simplification that won't equate "0599123456" with "+970599123456", so
// both sides need to enter the number the same plain local way (no country code needed, just
// consistently either way).
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

// A too-short digit string is almost always a local number typed without its country code —
// the exact scenario that makes normalizePhone's digits-only comparison collide across two
// different people's numbers (see claim-pending-import/route.ts). This doesn't eliminate that
// risk (two full, correctly-entered numbers can still coincidentally match), it only rejects the
// most common and most avoidable cause of it: someone leaving the country code off entirely.
export const MIN_PHONE_DIGITS = 8;

export function isPlausiblePhone(normalized: string): boolean {
  return normalized.length >= MIN_PHONE_DIGITS;
}
