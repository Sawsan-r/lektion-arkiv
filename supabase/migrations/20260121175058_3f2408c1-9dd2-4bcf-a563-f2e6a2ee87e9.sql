-- Tilldela student-roll till användare som saknar roller
INSERT INTO user_roles (user_id, role)
SELECT id, 'student'::app_role 
FROM profiles 
WHERE id IN (
  'affbdc20-3fa8-4880-b450-2f41c6308616',
  'bc878d6a-42c5-45b6-94bd-56eb8a7cf4f5',
  '06a59e00-85f1-45b5-b172-68be1e459008'
)
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = profiles.id
);