/*
# Secure admin access

The previous policies allowed every authenticated Supabase user to modify
products and site settings. That is unsafe when public sign-up is enabled.

This migration introduces an explicit admin allow-list. Client applications
can only read their own membership; they cannot grant themselves admin rights.

IMPORTANT after applying this migration:
Add the intended admin user once from the Supabase SQL editor, for example:

  insert into public.admin_users (user_id)
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
  on conflict (user_id) do nothing;

Do not expose or automate this insert from the browser.
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_read_own_membership" ON public.admin_users;
CREATE POLICY "admin_users_read_own_membership"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Products remain publicly readable, but only explicit admins may write.
DROP POLICY IF EXISTS "anon_insert_products" ON public.products;
DROP POLICY IF EXISTS "anon_update_products" ON public.products;
DROP POLICY IF EXISTS "anon_delete_products" ON public.products;
DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
DROP POLICY IF EXISTS "admin_delete_products" ON public.products;

CREATE POLICY "admin_insert_products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Site settings use the same explicit-admin rule.
DROP POLICY IF EXISTS "admin_insert_settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin_update_settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin_delete_settings" ON public.site_settings;

CREATE POLICY "admin_insert_settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_settings"
  ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
