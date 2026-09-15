"use client";

import { useState, useRef, ChangeEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n";
import type { ChatAttachment, ChatMessage, ChatRole } from "@/lib/mock-data";
import { MAX_ATTACHMENT_BYTES } from "@/lib/mock-data";
import { importMessages } from "@/lib/chat-store";
import { loadWhatsAppExport, type ParsedWhatsAppMessage } from "@/lib/whatsapp-import";
import { IconClose, IconWhatsapp } from "@/components/icons";

const PANEL_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

type Step = "upload" | "confirm";

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function blobToAttachment(conversationId: string, name: string, blob: Blob): Promise<ChatAttachment> {
  const storagePath = `chat-attachments/${conversationId}/${crypto.randomUUID()}-${sanitizeFileName(name)}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: blob.type || "application/octet-stream" });
  const url = await getDownloadURL(storageRef);
  return {
    name,
    kind: blob.type.startsWith("image/") ? "image" : "file",
    mimeType: blob.type,
    url,
    storagePath,
    size: blob.size,
  };
}

export default function ImportWhatsAppModal({
  open,
  onClose,
  conversationId,
  clientId,
  adminId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  clientId: string;
  adminId: string;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMessages, setParsedMessages] = useState<ParsedWhatsAppMessage[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Map<string, Blob>>(new Map());
  const [senders, setSenders] = useState<string[]>([]);
  const [meSender, setMeSender] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setStep("upload");
    setParsing(false);
    setError(null);
    setParsedMessages([]);
    setMediaFiles(new Map());
    setSenders([]);
    setMeSender(null);
    setSuccessCount(null);
    setSkippedCount(0);
    setImporting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParsing(true);
    setError(null);
    try {
      const result = await loadWhatsAppExport(file);
      if (result.messages.length === 0) {
        setError(t.chat.importErrorNoMessages);
        return;
      }
      if (result.senders.length > 2) {
        setError(t.chat.importErrorTooManySenders);
        return;
      }
      setParsedMessages(result.messages);
      setMediaFiles(result.mediaFiles);
      setSenders(result.senders);
      setMeSender(result.senders[0] ?? null);
      setStep("confirm");
    } catch {
      setError(t.chat.importErrorGeneric);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!meSender) return;
    setImporting(true);

    let skipped = 0;
    const toImport: Omit<ChatMessage, "id" | "conversationId">[] = [];

    for (const m of parsedMessages) {
      const senderRole: ChatRole = m.sender === meSender ? "admin" : "client";
      const senderId = senderRole === "admin" ? adminId : clientId;

      let attachment: ChatAttachment | undefined;
      if (m.mediaFilename) {
        const blob = mediaFiles.get(m.mediaFilename);
        if (blob) {
          if (blob.size > MAX_ATTACHMENT_BYTES) {
            skipped++;
          } else {
            try {
              attachment = await blobToAttachment(conversationId, m.mediaFilename, blob);
            } catch {
              // most likely: file storage isn't provisioned on the Firebase project yet —
              // skip just this one file rather than aborting the whole import
              skipped++;
            }
          }
        }
      }

      if (!m.text && !attachment) continue; // media referenced but unavailable/skipped, nothing left to show
      toImport.push({
        senderId,
        senderRole,
        text: m.text,
        attachment,
        sentAt: m.timestamp.toISOString(),
      });
    }

    const count = await importMessages(conversationId, toImport);
    setSuccessCount(count);
    setSkippedCount(skipped);
    setImporting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.chat.importTitle}
            className="card w-full max-w-md rounded-2xl p-5 sm:p-6"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
            transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">{t.chat.importTitle}</h2>
              <button
                onClick={handleClose}
                aria-label={t.chat.importCancel}
                className="text-muted hover:text-ink transition-colors"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            {successCount !== null ? (
              <div className="mt-5">
                <p className="text-sm text-ink">{withCount(t.chat.importSuccess, successCount)}</p>
                {skippedCount > 0 && (
                  <p className="text-xs text-muted mt-1">{withCount(t.chat.importSkippedFiles, skippedCount)}</p>
                )}
                <button
                  onClick={handleClose}
                  className="mt-4 rounded-full bg-mark px-4 py-1.5 text-xs font-semibold text-paper-raised hover:opacity-90 transition-opacity"
                >
                  {t.chat.importDone}
                </button>
              </div>
            ) : step === "upload" ? (
              <div className="mt-5">
                <p className="text-sm text-muted">{t.chat.importDescription}</p>
                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                <input ref={fileInputRef} type="file" accept=".txt,.zip" className="hidden" onChange={handleFile} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-mark px-4 py-2 text-xs font-semibold text-paper-raised hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <IconWhatsapp className="h-4 w-4" />
                  {parsing ? t.chat.importParsing : t.chat.importChooseFile}
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-ink">
                  {withCount(t.chat.importFoundMessages, parsedMessages.length)}
                  {mediaFiles.size > 0 && <> {withCount(t.chat.importFoundMedia, mediaFiles.size)}</>}
                </p>

                <p className="text-xs font-semibold mt-4 mb-2 text-muted">{t.chat.importWhoIsYou}</p>
                <div className="space-y-1.5">
                  {senders.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="radio"
                        name="me-sender"
                        checked={meSender === s}
                        onChange={() => setMeSender(s)}
                        className="accent-[var(--logo-violet)]"
                      />
                      {s}
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={handleConfirm}
                    disabled={importing}
                    className="rounded-full bg-mark px-4 py-1.5 text-xs font-semibold text-paper-raised hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {t.chat.importConfirm}
                  </button>
                  <button
                    onClick={() => setStep("upload")}
                    className="text-xs text-muted hover:text-ink transition-colors"
                  >
                    {t.chat.importCancel}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
