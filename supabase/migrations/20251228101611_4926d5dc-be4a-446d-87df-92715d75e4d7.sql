-- Create storage bucket for lesson audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-audio', 'lesson-audio', false);

-- RLS policies for lesson-audio bucket
-- Teachers can upload audio to their lessons
CREATE POLICY "Teachers can upload lesson audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-audio' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.classes 
    WHERE teacher_id = auth.uid()
  )
);

-- Teachers can view their own lesson audio
CREATE POLICY "Teachers can view own lesson audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.lessons l ON l.class_id = c.id
    WHERE c.teacher_id = auth.uid()
    AND storage.filename(name) LIKE l.id::text || '%'
  )
);

-- Students can view audio for lessons in their classes
CREATE POLICY "Students can view lesson audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    JOIN public.lessons l ON l.class_id = c.id
    WHERE cm.student_id = auth.uid()
    AND storage.filename(name) LIKE l.id::text || '%'
  )
);

-- Teachers can delete their own lesson audio
CREATE POLICY "Teachers can delete own lesson audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.lessons l ON l.class_id = c.id
    WHERE c.teacher_id = auth.uid()
    AND storage.filename(name) LIKE l.id::text || '%'
  )
);