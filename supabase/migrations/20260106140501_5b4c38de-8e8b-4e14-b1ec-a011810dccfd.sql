INSERT INTO public.user_roles (user_id, role)
VALUES ('583e3bef-d9ed-4b4e-b74d-9ee36935710f', 'system_admin')
ON CONFLICT (user_id, role) DO NOTHING;