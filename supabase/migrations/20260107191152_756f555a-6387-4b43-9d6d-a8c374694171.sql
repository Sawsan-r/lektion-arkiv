-- Allow authenticated users to insert their own student role
CREATE POLICY "Users can insert own student role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'student'
);