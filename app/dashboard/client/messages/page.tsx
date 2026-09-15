"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/chat/ChatThread";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getOrCreateClientConversation } from "@/lib/chat-store";

export default function ClientMessagesPage() {
  const { session, ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "client") {
      router.replace("/login");
      return;
    }
    if (!session.id) return;
    getOrCreateClientConversation(session.id).then((c) => setConversationId(c.id));
  }, [ready, session.role, session.id, router]);

  if (!ready || session.role !== "client" || !session.id || !conversationId) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl h-[calc(100vh-72px)] sm:py-4">
          <div className="card h-full sm:rounded-2xl overflow-hidden">
            <ChatThread
              conversationId={conversationId}
              viewerRole="client"
              viewerId={session.id}
              peerName={t.chat.supportTeamName}
            />
          </div>
        </div>
      </main>
    </>
  );
}
