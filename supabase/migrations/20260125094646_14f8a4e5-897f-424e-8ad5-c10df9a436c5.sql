-- Drop the existing policy that requires authenticated role
DROP POLICY IF EXISTS "Users can insert own student role" ON public.user_roles;

-- Recreate the policy allowing public role (security maintained via auth.uid() check)
CREATE POLICY "Users can insert own student role"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK ((user_id = auth.uid()) AND (role = 'student'::app_role));