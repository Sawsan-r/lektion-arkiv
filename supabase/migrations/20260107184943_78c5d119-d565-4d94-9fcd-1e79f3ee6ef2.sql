-- Allow anyone to view teacher profiles (just basic info needed for class join)
-- This is a SELECT policy for public read access
CREATE POLICY "Anyone can view teacher profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = profiles.id 
    AND user_roles.role = 'teacher'
  )
);

-- Allow anyone to view organization names (for class join display)
CREATE POLICY "Anyone can view organization names"
ON public.organizations
FOR SELECT
USING (true);