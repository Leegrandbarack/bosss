
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- RLS: conversations
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
USING (public.is_conversation_participant(auth.uid(), id));

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (public.is_conversation_participant(auth.uid(), id));

-- RLS: conversation_participants
CREATE POLICY "Participants can view members"
ON public.conversation_participants FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Authenticated can add participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants FOR DELETE
USING (auth.uid() = user_id);

-- RLS: messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(auth.uid(), conversation_id)
);

CREATE POLICY "Senders can update their messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

CREATE POLICY "Participants can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
