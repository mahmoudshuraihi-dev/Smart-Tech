// Client-side password strength check, ahead of Firebase's own 6-character minimum.
// Deliberately simple — length + one letter + one digit — no external validator library.
export const MIN_PASSWORD_LENGTH = 8;

export function isStrongPassword(pw: string): boolean {
  return pw.length >= MIN_PASSWORD_LENGTH && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}
