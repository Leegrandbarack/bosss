-- Add reaction type to post_likes
ALTER TABLE public.post_likes ADD COLUMN reaction_type text NOT NULL DEFAULT 'like';

-- Add privacy settings to profiles
ALTER TABLE public.profiles ADD COLUMN is_private boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN privacy_who_can_add text NOT NULL DEFAULT 'everyone';
ALTER TABLE public.profiles ADD COLUMN privacy_who_can_see_posts text NOT NULL DEFAULT 'everyone';
ALTER TABLE public.profiles ADD COLUMN privacy_friends_list text NOT NULL DEFAULT 'everyone';