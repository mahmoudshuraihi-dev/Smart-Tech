"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/chat/ChatThread";
import ConversationList from "@/components/chat/ConversationList";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { type Conversation } from "@/lib/mock-data";
import { subscribeToAllConversations } from "@/lib/chat-store";
import { useClientDirectory, getClientName } from "@/lib/user-directory";

export default function AdminMessagesPage() {
  const { session, ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const directory = useClientDirectory();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "admin") {
      router.replace("/login");
      return;
    }
    return subscribeToAllConversations(setConversations);
  }, [ready, session.role, router]);

  if (!ready || session.role !== "admin") return null;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl h-[calc(100vh-72px)] sm:py-4">
          <div className="card h-full min-h-0 sm:rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr]">
            <div className={`${selected ? "hidden lg:block" : "block"} border-e-0 lg:border-e border-line h-full overflow-y-auto`}>
              <p className="px-4 py-3.5 text-sm font-semibold border-b border-line">{t.chat.heading}</p>
              <ConversationList
                conversations={conversations}
                directory={directory}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

            <div className={`${selected ? "block" : "hidden lg:block"} h-full min-h-0`}>
              {selected ? (
                <ChatThread
                  conversationId={selected.id}
                  viewerRole="admin"
                  viewerId={session.id ?? ""}
                  peerName={getClientName(directory, selected.clientId)}
                  onBack={() => setSelectedId(null)}
                  onDeleted={() => setSelectedId(null)}
                />
              ) : (
                <p className="text-sm text-muted text-center p-10">{t.chat.selectConversation}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
