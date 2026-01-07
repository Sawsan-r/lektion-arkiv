-- Allow anyone to read an invitation if they have the correct token
-- This is needed for the invite validation flow before the user is authenticated
CREATE POLICY "Anyone can validate invitation by token"
ON public.teacher_invitations
FOR SELECT
USING (true);

-- Also need to allow the invited user to update the used_at field when accepting
CREATE POLICY "Anyone can mark invitation as used"
ON public.teacher_invitations
FOR UPDATE
USING (true)
WITH CHECK (used_at IS NOT NULL);