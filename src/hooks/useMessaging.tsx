import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface Participant {
  user_id: string;
  is_online: boolean;
  last_seen_at: string | null;
  last_read_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participantRows?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const ids = participantRows.map((p) => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (!convos) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch participants with profiles for each conversation
    const enriched: Conversation[] = await Promise.all(
      convos.map(async (c) => {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id, is_online, last_seen_at, last_read_at")
          .eq("conversation_id", c.id);

        const participants: Participant[] = [];
        if (parts) {
          for (const p of parts) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, username")
              .eq("user_id", p.user_id)
              .single();
            participants.push({ ...p, profile: prof || undefined });
          }
        }

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        return {
          ...c,
          participants,
          last_message: lastMsg || null,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createDirectConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke("create-conversation", {
        body: { otherUserId },
      });

      if (error || !data?.conversationId) return null;

      await fetchConversations();
      return data.conversationId as string;
    },
    [user, fetchConversations]
  );

  return { conversations, loading, fetchConversations, createDirectConversation };
}

export function useChat(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
      });
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  // Send text message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !content.trim()) return;
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: "text",
      });
      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [conversationId, user]
  );

  // Send file/image/voice
  const sendFile = useCallback(
    async (file: File, type: "image" | "file" | "voice") => {
      if (!conversationId || !user) return;

      const path = `${user.id}/${conversationId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(path, file);

      if (uploadError) return;

      const { data: urlData } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(path);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: type === "voice" ? "🎤 Message vocal" : file.name,
        message_type: type,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
      });

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [conversationId, user]
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  }, [conversationId, user]);

  return { messages, loading, sendMessage, sendFile, markAsRead };
}

// Presence hook for online status
export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set online
    supabase
      .from("conversation_participants")
      .update({ is_online: true, last_seen_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .then(() => {});

    const interval = setInterval(() => {
      supabase
        .from("conversation_participants")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then(() => {});
    }, 30000);

    const handleOffline = () => {
      supabase
        .from("conversation_participants")
        .update({ is_online: false, last_seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then(() => {});
    };

    window.addEventListener("beforeunload", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
      handleOffline();
    };
  }, [user]);
}
