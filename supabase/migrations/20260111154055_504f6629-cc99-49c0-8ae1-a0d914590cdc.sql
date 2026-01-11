-- Drop the broken storage policies
DROP POLICY IF EXISTS "Students can view lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own lesson audio" ON storage.objects;

-- Create corrected policies that properly check the file name against lesson ID

-- Teachers can view their lesson audio files
CREATE POLICY "Teachers can view own lesson audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN classes c ON c.id = l.class_id
    WHERE c.teacher_id = auth.uid()
    AND storage.filename(storage.objects.name) LIKE l.id::text || '%'
  )
);

-- Teachers can delete their lesson audio files
CREATE POLICY "Teachers can delete own lesson audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN classes c ON c.id = l.class_id
    WHERE c.teacher_id = auth.uid()
    AND storage.filename(storage.objects.name) LIKE l.id::text || '%'
  )
);

-- Students can view audio for lessons in classes they're members of
CREATE POLICY "Students can view lesson audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN class_members cm ON cm.class_id = l.class_id
    WHERE cm.student_id = auth.uid()
    AND storage.filename(storage.objects.name) LIKE l.id::text || '%'
  )
);