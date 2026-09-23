"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { MAX_ATTACHMENT_BYTES } from "@/lib/models";
import { IconSend, IconPaperclip, IconFile, IconClose } from "@/components/icons";

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

export default function Composer({
  onSend,
}: {
  onSend: (text: string | undefined, file: File | undefined) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [error, setError] = useState<"tooLarge" | "uploadFailed" | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // local-preview object URLs are per-file resources the browser won't reclaim on its
  // own — revoke on replace/unmount so repeated attach/remove cycles don't leak memory
  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("tooLarge");
      return;
    }
    setError(null);
    setPending({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  };

  const removePending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed && !pending) return;
    setSending(true);
    try {
      await onSend(trimmed || undefined, pending?.file ?? undefined);
      setText("");
      setPending(null);
      setError(null);
    } catch {
      // most likely: file storage isn't provisioned on the Firebase project yet —
      // text sends are unaffected, only the attachment upload failed
      setError("uploadFailed");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-line px-3 py-3 sm:px-4">
      {pending && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-paper-raised border border-line px-2.5 py-1.5">
          {pending.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
            <img src={pending.previewUrl} alt={pending.file.name} className="h-8 w-8 rounded object-cover" />
          ) : (
            <IconFile className="h-5 w-5 text-muted shrink-0" />
          )}
          <span className="text-xs text-ink truncate max-w-[10rem]">{pending.file.name}</span>
          <button
            type="button"
            onClick={removePending}
            aria-label={t.a11y.removeAttachment}
            className="text-muted hover:text-ink transition-colors"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500">
          {error === "tooLarge" ? t.chat.fileTooLarge : t.chat.uploadFailed}
        </p>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.zip"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t.chat.attach}
          className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-mark hover:bg-paper-raised transition-colors"
        >
          <IconPaperclip className="h-5 w-5" />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.placeholder}
          rows={1}
          className="flex-1 min-w-0 resize-none rounded-2xl border border-line bg-paper-raised px-4 py-2.5 text-sm text-ink placeholder-muted/70 outline-none focus-visible:border-mark max-h-32"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!text.trim() && !pending) || sending}
          aria-label={t.chat.send}
          className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
        >
          <IconSend className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}
