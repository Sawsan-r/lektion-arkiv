-- Add foreign key from classes.teacher_id to profiles.id
-- This enables the Supabase JS client to join classes with profiles
ALTER TABLE public.classes
ADD CONSTRAINT classes_teacher_id_profiles_fkey
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);

-- Allow public read on user_roles to support the teacher profile check
CREATE POLICY "Anyone can check teacher roles"
ON public.user_roles
FOR SELECT
USING (role = 'teacher');