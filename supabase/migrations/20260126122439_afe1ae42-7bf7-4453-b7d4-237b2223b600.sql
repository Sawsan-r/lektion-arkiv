
-- Assign teacher role to existing users who have valid invitations but no role
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT u.id, 'teacher'::app_role
FROM auth.users u
JOIN teacher_invitations ti ON lower(ti.email) = lower(u.email::text)
WHERE ti.used_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'teacher'
);

-- Mark their invitations as used
UPDATE teacher_invitations ti
SET used_at = NOW()
FROM auth.users u
WHERE lower(ti.email) = lower(u.email::text)
AND ti.used_at IS NULL
AND EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'teacher'
);
