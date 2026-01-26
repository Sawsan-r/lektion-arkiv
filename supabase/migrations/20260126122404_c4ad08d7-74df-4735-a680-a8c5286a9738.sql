
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own teacher role via invite" ON public.user_roles;

-- Create new policy with case-insensitive email matching
CREATE POLICY "Users can insert own teacher role via invite"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'teacher'
  AND EXISTS (
    SELECT 1 FROM teacher_invitations 
    WHERE lower(email) = lower(auth.email())
    AND used_at IS NULL
  )
);
