// Shared by the admin's bulk WhatsApp pre-import upload and the student signup form — the only
// identifier a not-yet-existing student account and a WhatsApp export have in common. Digits
// only: a deliberate simplification that won't equate "0599123456" with "+970599123456", so
// both sides need to enter the number the same plain local way (no country code needed, just
// consistently either way).
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}
