-- Create a security definer function to check if user is teacher of a class
-- This avoids recursive RLS policy evaluation
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = _class_id AND teacher_id = _user_id
  )
$$;

-- Create a security definer function to check if user is student in a class
CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = _class_id AND student_id = _user_id
  )
$$;

-- Drop and recreate the problematic policies using the security definer functions
DROP POLICY IF EXISTS "Students can view joined classes" ON public.classes;
CREATE POLICY "Students can view joined classes"
ON public.classes
FOR SELECT
USING (is_class_member(id, auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage class members" ON public.class_members;
CREATE POLICY "Teachers can view class members"
ON public.class_members
FOR SELECT
USING (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can insert class members"
ON public.class_members
FOR INSERT
WITH CHECK (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can update class members"
ON public.class_members
FOR UPDATE
USING (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can delete class members"
ON public.class_members
FOR DELETE
USING (is_class_teacher(class_id, auth.uid()));

-- Fix lessons policies too
DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
CREATE POLICY "Teachers can view lessons"
ON public.lessons
FOR SELECT
USING (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can insert lessons"
ON public.lessons
FOR INSERT
WITH CHECK (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can update lessons"
ON public.lessons
FOR UPDATE
USING (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can delete lessons"
ON public.lessons
FOR DELETE
USING (is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Students can view lessons" ON public.lessons;
CREATE POLICY "Students can view lessons"
ON public.lessons
FOR SELECT
USING (is_class_member(class_id, auth.uid()));