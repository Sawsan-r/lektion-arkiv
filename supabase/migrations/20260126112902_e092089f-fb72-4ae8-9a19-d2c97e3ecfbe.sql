-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can insert own teacher role via invite" ON public.user_roles;

-- Create new policy using auth.email() instead of subquery on auth.users
CREATE POLICY "Users can insert own teacher role via invite"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'teacher'
  AND EXISTS (
    SELECT 1 FROM teacher_invitations 
    WHERE email = auth.email()
    AND used_at IS NULL
  )
);