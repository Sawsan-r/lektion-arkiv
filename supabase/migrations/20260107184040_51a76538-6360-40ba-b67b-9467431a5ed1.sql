-- Drop the problematic ALL policy and replace with specific policies
DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;

-- Create separate policies for each operation type
CREATE POLICY "Teachers can view own classes"
ON public.classes
FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own classes"
ON public.classes
FOR INSERT
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own classes"
ON public.classes
FOR UPDATE
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes"
ON public.classes
FOR DELETE
USING (teacher_id = auth.uid());