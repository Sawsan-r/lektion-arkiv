-- Drop existing policy that may have issues
DROP POLICY IF EXISTS "Teachers can upload lesson audio" ON storage.objects;

-- Create simpler policy that allows any authenticated teacher to upload
CREATE POLICY "Teachers can upload lesson audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-audio'
  AND (
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'teacher'
    )
  )
);

-- Clean up stuck lessons that have no audio
DELETE FROM public.lessons WHERE status = 'recording' AND audio_url IS NULL;