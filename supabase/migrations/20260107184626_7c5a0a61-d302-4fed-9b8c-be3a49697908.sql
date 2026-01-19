-- Allow anyone to look up a class by join_code for the join flow
-- This is needed before the student is authenticated
CREATE POLICY "Anyone can lookup class by join code"
ON public.classes
FOR SELECT
USING (true);