"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { ChatMessage, ChatRole, PaymentStatus } from "@/lib/mock-data";
import { BOT_SENDER_ID } from "@/lib/mock-data";
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  sendMessageWithFile,
  markRead,
  setPaymentStatus,
} from "@/lib/chat-store";
import { getBotSettingsOnce } from "@/lib/bot-store";
import { findFaqMatch } from "@/lib/faq-match";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { PaymentStatusToggle } from "./PaymentBadge";
import ImportWhatsAppModal from "./ImportWhatsAppModal";
import { IconArrow, IconWhatsapp } from "@/components/icons";

// delay before the auto-reply lands, so it reads as a reply rather than an instant echo
const AUTO_REPLY_DELAY_MS = 700;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function ChatThread({
  conversationId,
  viewerRole,
  viewerId,
  peerName,
  onBack,
}: {
  conversationId: string;
  viewerRole: ChatRole;
  viewerId: string;
  peerName: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paymentStatus, setLocalPaymentStatus] = useState<PaymentStatus | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubMessages = subscribeToMessages(conversationId, setMessages);
    const unsubConversation = subscribeToConversation(conversationId, (c) => {
      setLocalPaymentStatus(c?.paymentStatus ?? null);
    });
    markRead(conversationId, viewerRole);
    return () => {
      unsubMessages();
      unsubConversation();
    };
  }, [conversationId, viewerRole]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, reduceMotion]);

  const autoReply = useCallback(
    (replyText: string) => {
      if (!replyText) return;
      setTimeout(() => {
        if (!mountedRef.current) return;
        sendMessage(conversationId, BOT_SENDER_ID, "admin", replyText);
      }, AUTO_REPLY_DELAY_MS);
    },
    [conversationId],
  );

  const handleSend = async (text: string | undefined, file: File | undefined) => {
    const isFirstMessage = messages.length === 0;

    if (file) {
      await sendMessageWithFile(conversationId, viewerId, viewerRole, text, file);
    } else {
      await sendMessage(conversationId, viewerId, viewerRole, text);
    }

    if (viewerRole !== "client" || !text) return;

    const botSettings = await getBotSettingsOnce();

    if (isFirstMessage) {
      // a brand-new conversation: the student's first message always gets this fixed
      // welcome reply, exclusively — no rule matching attempted for it
      autoReply(botSettings.welcomeMessage);
    } else {
      const match = findFaqMatch(text, botSettings.rules);
      if (match) autoReply(match.a);
    }
  };

  const handlePaymentChange = (status: PaymentStatus) => {
    setPaymentStatus(conversationId, status);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="text-muted hover:text-ink transition-colors lg:hidden"
            >
              <IconArrow className="h-5 w-5 rotate-180 rtl:rotate-0" />
            </button>
          )}
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-display text-xs"
            style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
          >
            {getInitials(peerName)}
          </span>
          <p className="font-display text-sm sm:text-base truncate">{peerName}</p>
        </div>

        {viewerRole === "admin" && paymentStatus && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted shrink-0">{t.chat.paymentLabel}:</span>
            <PaymentStatusToggle status={paymentStatus} onChange={handlePaymentChange} />
            <button
              onClick={() => setImportOpen(true)}
              aria-label={t.chat.importWhatsapp}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-mark hover:border-mark/50 transition-colors"
            >
              <IconWhatsapp className="h-3.5 w-3.5" />
              {t.chat.importWhatsapp}
            </button>
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted text-center mt-6">{t.chat.empty}</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} isOwn={m.senderRole === viewerRole} />)
        )}
      </div>

      <Composer onSend={handleSend} />

      {viewerRole === "admin" && (
        <ImportWhatsAppModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          conversationId={conversationId}
          clientId={conversationId}
          adminId={viewerId}
        />
      )}
    </div>
  );
}
