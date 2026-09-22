"use client";

import { useI18n } from "@/lib/i18n";
import type { Conversation } from "@/lib/models";
import { getClientName } from "@/lib/user-directory";
import { PaymentBadge } from "./PaymentBadge";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function ConversationList({
  conversations,
  directory,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  directory: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  if (conversations.length === 0) {
    return <p className="text-sm text-muted text-center p-6">{t.chat.noConversations}</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-y-auto">
      {conversations.map((conv) => {
        const name = getClientName(directory, conv.clientId);
        const unread = conv.unreadForAdmin;
        const isActive = conv.id === selectedId;

        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-start transition-colors ${
                isActive ? "bg-mark/10" : "hover:bg-paper-raised"
              }`}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white font-display text-sm"
                style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
              >
                {getInitials(name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink truncate">{name}</span>
                  {unread > 0 && (
                    <span className="shrink-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mark px-1.5 text-[10px] font-semibold text-paper-raised">
                      {unread}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted truncate mt-0.5">{conv.lastMessagePreview}</span>
                <PaymentBadge status={conv.paymentStatus} className="mt-1.5" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
