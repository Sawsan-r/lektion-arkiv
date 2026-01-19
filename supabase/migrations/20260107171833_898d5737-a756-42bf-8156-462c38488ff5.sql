INSERT INTO public.user_roles (user_id, role)
VALUES ('d972a338-4634-41ad-8307-3df663c1319b', 'system_admin')
ON CONFLICT (user_id, role) DO NOTHING;