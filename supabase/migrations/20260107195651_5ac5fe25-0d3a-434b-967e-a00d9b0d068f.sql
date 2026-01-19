-- Drop the broken policy that has TO authenticated (restricts to wrong role)
DROP POLICY IF EXISTS "Teachers can upload lesson audio" ON storage.objects;

-- Create policy WITHOUT "TO authenticated" - applies to all roles including supabase_storage_admin
-- The has_role() function is SECURITY DEFINER and bypasses RLS on user_roles table
CREATE POLICY "Teachers can upload lesson audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-audio'
  AND public.has_role(auth.uid(), 'teacher')
);