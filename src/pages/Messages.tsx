import { useState, useCallback } from "react";
import { useConversations, usePresence } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ConversationList from "@/components/messaging/ConversationList";
import ChatView from "@/components/messaging/ChatView";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const { conversations, createDirectConversation } = useConversations();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("conv"));

  usePresence();

  const selected = conversations.find((c) => c.id === selectedId);
  const other = selected?.participants?.find((p) => p.user_id !== user?.id);
  const title = selected?.title || other?.profile?.full_name || "Conversation";

  const handleNewConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return;
      const convId = await createDirectConversation(otherUserId);
      if (convId) setSelectedId(convId);
    },
    [user, createDirectConversation]
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${
            selectedId ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNewConversation={handleNewConversation}
          />
        </div>

        <div className={`flex-1 ${!selectedId ? "hidden md:flex" : "flex"}`}>
          {selectedId && selected ? (
            <div className="flex-1">
              <ChatView
                conversationId={selectedId}
                participants={selected.participants || []}
                title={title}
                onBack={() => setSelectedId(null)}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <div className="gradient-primary rounded-full p-5 mb-4 opacity-20">
                <MessageSquare className="h-12 w-12 text-primary-foreground" />
              </div>
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-1">ou créez-en une nouvelle</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
