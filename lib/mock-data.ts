export type Stage = "received" | "in_review" | "in_progress" | "revision" | "completed";

export const STAGES: Stage[] = ["received", "in_review", "in_progress", "revision", "completed"];

export interface StageEvent {
  stage: Stage;
  at: string;
}

export interface DeliverableFile {
  name: string;
  uploadedAt: string;
}

export interface ProjectRequest {
  id: string;
  clientId: string;
  serviceId: ServiceId;
  createdAt: string;
  stage: Stage;
  history: StageEvent[];
  file?: DeliverableFile;
}

export const SERVICE_IDS = [
  "editing",
  "statistics",
  "methodology",
  "literature",
  "formatting",
  "coaching",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type BookingStatus = "new" | "contacted";

// A public, no-account lead: name + phone + desired service, submitted from the homepage
// booking form (app/api/bookings/route.ts) with no signup required. Deliberately separate
// from ProjectRequest/`requests` — that flow is for signed-up clients tracking a project
// through stages; this is just a contact-me-back lead for the business to follow up on.
export interface BookingLead {
  id: string;
  name: string;
  phone: string;
  phoneNormalized: string;
  serviceId: ServiceId;
  status: BookingStatus;
  locale: "ar" | "en";
  createdAt: string;
}

export type ChatRole = "client" | "admin";

// sentinel senderId for the automated welcome/FAQ auto-reply — a real client's own browser
// writes these messages, but Firestore rules only allow it when the text exactly matches
// one of the admin's own pre-approved strings (see firestore.rules), so this can never be
// used to forge arbitrary admin-looking content
export const BOT_SENDER_ID = "bot";

// Storage upload cap for chat attachments — enforced for real by storage.rules; this is
// just the client-side UX check (immediate feedback before attempting the upload)
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export interface ChatAttachment {
  name: string;
  kind: "image" | "file";
  mimeType: string;
  url: string;
  storagePath: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ChatRole;
  text?: string;
  attachment?: ChatAttachment;
  sentAt: string;
}

export type PaymentStatus = "paid" | "unpaid" | "partial";

// one conversation per client (not per-request) — students message admin about anything,
// not a specific ticket, so the doc id is just the client's own Auth uid
export interface Conversation {
  id: string;
  clientId: string;
  lastReadByClient: string;
  lastReadByAdmin: string;
  paymentStatus: PaymentStatus;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadForClient: number;
  unreadForAdmin: number;
}

export interface AutoReplyRule {
  id: string;
  q: string;
  a: string;
}

export interface BotSettings {
  welcomeMessage: string;
  rules: AutoReplyRule[];
  // flat parallel array of every rule's answer, kept in sync with `rules` on every write —
  // needed because the Firestore security rule that bounds the client-authored bot-reply
  // loophole (see firestore.rules) can't project an array-of-maps field for its `in` check
  ruleAnswers: string[];
}
