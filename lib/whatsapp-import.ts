// Parses WhatsApp's own "Export chat" output (.txt, or .zip when media is included).
// Best-effort: tuned to the two dominant export line formats (Android hyphen-separated,
// iOS bracketed-with-seconds), 12h/24h clocks — not a full grammar for every WhatsApp
// locale/version, same spirit as the heuristic matcher in lib/faq-match.ts.

export interface ParsedWhatsAppMessage {
  sender: string;
  timestamp: Date;
  text?: string;
  mediaFilename?: string;
}

export interface WhatsAppParseResult {
  messages: ParsedWhatsAppMessage[];
  senders: string[];
}

export interface WhatsAppExportResult extends WhatsAppParseResult {
  mediaFiles: Map<string, Blob>;
}

// "12/25/23, 10:30 AM - Sender Name: message text"     (Android)
// "[12/25/23, 10:30:15 AM] Sender Name: message text"  (iOS)
const MESSAGE_LINE =
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\]?\s*-?\s*([^:]+):\s(.*)$/;
// same timestamp prefix, but no "Name:" after it — WhatsApp's own system/notification
// lines ("Messages and calls are end-to-end encrypted...", "X changed the subject", ...)
const SYSTEM_LINE =
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\]?\s*-?\s*(.*)$/;

const MEDIA_ATTACHED = /<attached:\s*(.+?)>/i;
const MEDIA_OMITTED = /<Media omitted>/i;

// JSZip doesn't sniff content type from the file extension — every entry it hands back
// is a generic "application/octet-stream" blob unless we set it ourselves, which would
// make every imported photo render as a plain file download instead of an image preview
const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  "3gp": "video/3gpp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  pdf: "application/pdf",
  opus: "audio/ogg",
  mp3: "audio/mpeg",
  aac: "audio/aac",
};

function inferMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_TYPES[ext] ?? "application/octet-stream";
}

function stripInvisible(line: string): string {
  // WhatsApp sometimes prefixes lines with an invisible LRM/RLM/embedding mark
  return line.replace(/[‎‏‪-‮]/g, "");
}

function parseTimestamp(dateStr: string, timeStr: string): Date | null {
  const parts = dateStr.split("/").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [a, b, rawYear] = parts;
  const year = rawYear < 100 ? rawYear + 2000 : rawYear;
  // D/M/Y vs M/D/Y is ambiguous per-export/region — assume M/D/Y (the common default)
  // unless the first number can only be a day (>12)
  const month = a > 12 ? b : a;
  const day = a > 12 ? a : b;

  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AaPp][Mm])?$/);
  if (!timeMatch) return null;
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const meridiem = timeMatch[4]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseWhatsAppText(raw: string): WhatsAppParseResult {
  const messages: ParsedWhatsAppMessage[] = [];
  const senderOrder: string[] = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = stripInvisible(rawLine);
    if (!line.trim()) continue;

    const match = line.match(MESSAGE_LINE);
    if (match) {
      const [, dateStr, timeStr, senderRaw, body] = match;
      const timestamp = parseTimestamp(dateStr, timeStr);
      if (!timestamp) continue;

      const sender = senderRaw.trim();
      if (!senderOrder.includes(sender)) senderOrder.push(sender);

      const mediaMatch = body.match(MEDIA_ATTACHED);
      const isOmitted = MEDIA_OMITTED.test(body);
      messages.push({
        sender,
        timestamp,
        text: mediaMatch || isOmitted ? undefined : body,
        mediaFilename: mediaMatch ? mediaMatch[1].trim() : undefined,
      });
      continue;
    }

    if (SYSTEM_LINE.test(line)) continue; // system/notification line, not a message

    // no timestamp at all → continuation of the previous message (multi-line message)
    const last = messages[messages.length - 1];
    if (last) last.text = last.text ? `${last.text}\n${line}` : line;
  }

  return { messages, senders: senderOrder };
}

export async function loadWhatsAppExport(file: File): Promise<WhatsAppExportResult> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(file);
    let raw = "";
    const mediaFiles = new Map<string, Blob>();

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue;
      const name = entry.name.split("/").pop() ?? entry.name;
      if (name.toLowerCase().endsWith(".txt")) {
        raw = await entry.async("string");
      } else {
        const blob = await entry.async("blob");
        mediaFiles.set(name, blob.type ? blob : new Blob([blob], { type: inferMimeType(name) }));
      }
    }

    return { ...parseWhatsAppText(raw), mediaFiles };
  }

  const raw = await file.text();
  return { ...parseWhatsAppText(raw), mediaFiles: new Map() };
}
