
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view friends posts and own" ON public.posts;
DROP POLICY IF EXISTS "Users can view friends stories" ON public.stories;

-- Posts visible by all authenticated users
CREATE POLICY "Authenticated users can view all posts"
ON public.posts FOR SELECT TO authenticated
USING (true);

-- Stories visible by all authenticated users
CREATE POLICY "Authenticated users can view all stories"
ON public.stories FOR SELECT TO authenticated
USING (true);
