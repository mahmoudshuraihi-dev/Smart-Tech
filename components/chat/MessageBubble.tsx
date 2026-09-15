"use client";

import { useI18n } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/mock-data";
import { IconFile } from "@/components/icons";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const { locale } = useI18n();
  const time = new Date(message.sentAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 ${
          isOwn ? "text-white" : "card"
        }`}
        style={isOwn ? { background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" } : undefined}
      >
        {message.attachment?.kind === "image" ? (
          <a href={message.attachment.url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Firebase Storage URL, not an optimizable next/image asset */}
            <img
              src={message.attachment.url}
              alt={message.attachment.name}
              className="max-h-56 w-auto rounded-lg object-cover"
            />
          </a>
        ) : message.attachment ? (
          <a
            href={message.attachment.url}
            download={message.attachment.name}
            target="_blank"
            rel="noopener noreferrer"
            className={`mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
              isOwn ? "bg-white/15 hover:bg-white/25" : "bg-paper hover:bg-line/40"
            }`}
          >
            <IconFile className={`h-5 w-5 shrink-0 ${isOwn ? "text-white" : "text-muted"}`} />
            <span className="min-w-0">
              <span className={`block text-xs font-semibold truncate ${isOwn ? "text-white" : "text-ink"}`}>
                {message.attachment.name}
              </span>
              <span className={`block text-[10px] ${isOwn ? "text-white/70" : "text-muted"}`}>
                {formatSize(message.attachment.size)}
              </span>
            </span>
          </a>
        ) : null}

        {message.text && (
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isOwn ? "text-white" : "text-ink"}`}>
            {message.text}
          </p>
        )}

        <span className={`block mt-1 text-[10px] ${isOwn ? "text-white/70" : "text-muted"} text-end`}>{time}</span>
      </div>
    </div>
  );
}
