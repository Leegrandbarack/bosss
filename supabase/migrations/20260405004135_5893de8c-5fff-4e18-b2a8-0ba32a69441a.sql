
-- Fix: conversations INSERT - only allow if user will be a participant
DROP POLICY "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: conversation_participants INSERT - only allow adding yourself
DROP POLICY "Authenticated can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add themselves as participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
