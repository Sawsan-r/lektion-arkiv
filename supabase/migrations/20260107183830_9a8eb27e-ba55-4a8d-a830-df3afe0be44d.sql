-- First, insert the missing teacher role for the user who just signed up
INSERT INTO public.user_roles (user_id, role)
VALUES ('af6737ab-3c5b-413b-ac68-7272a653c45f', 'teacher');

-- Add policy to allow inserting teacher role during invite acceptance
-- This allows a newly authenticated user to insert their own teacher role
CREATE POLICY "Users can insert own teacher role via invite"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'teacher'
  AND EXISTS (
    SELECT 1 FROM teacher_invitations 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND used_at IS NULL
  )
);