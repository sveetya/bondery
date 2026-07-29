-- Platform admin moved to Better Auth user.role — drop legacy is_admin column + RLS helper.

DROP POLICY IF EXISTS "Users cannot self-promote to admin" ON public.user_settings;

DROP FUNCTION IF EXISTS public.get_user_settings_is_admin(uuid);

ALTER TABLE public.user_settings DROP COLUMN IF EXISTS is_admin;
