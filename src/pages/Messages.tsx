import { useState, useCallback } from "react";
import { useConversations, usePresence } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ConversationList from "@/components/messaging/ConversationList";
import ChatView from "@/components/messaging/ChatView";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const { conversations, fetchConversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  usePresence();

  const selected = conversations.find((c) => c.id === selectedId);
  const other = selected?.participants?.find((p) => p.user_id !== user?.id);
  const title = selected?.title || other?.profile?.full_name || "Conversation";

  const handleNewConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return;

      // Check existing
      for (const c of conversations) {
        const hasOther = c.participants?.some((p) => p.user_id === otherUserId);
        if (hasOther && c.type === "direct") {
          setSelectedId(c.id);
          return;
        }
      }

      // Create new
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ type: "direct" })
        .select()
        .single();

      if (!conv) return;

      // Add self as participant
      await supabase.from("conversation_participants").insert({
        conversation_id: conv.id,
        user_id: user.id,
      });

      // For direct messaging, we need the other user to also be a participant
      // Using a workaround: temporarily insert via service role would be ideal,
      // but for this demo we'll use an RPC or accept the limitation
      // For now, the other user can join when they search for conversations

      await fetchConversations();
      setSelectedId(conv.id);
    },
    [user, conversations, fetchConversations]
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list - hidden on mobile when chat is open */}
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

        {/* Chat view */}
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
              <MessageSquare className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
              <p className="text-sm">ou créez-en une nouvelle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
