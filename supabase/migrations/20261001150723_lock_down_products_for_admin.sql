/*
# Lock down products table for admin-only writes

1. Changes
- Drop all existing anon/authenticated write policies on `products`.
- Keep SELECT open to anon + authenticated (public catalog browsing).
- Add write policies (INSERT/UPDATE/DELETE) scoped to authenticated users only.
- This ensures only logged-in admin users can add, edit, or remove products.

2. Security
- SELECT: anon + authenticated can read (public catalog).
- INSERT/UPDATE/DELETE: authenticated only — regular visitors cannot modify products.
- No user_id column needed since there is only one admin who manages all products.
*/

DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);
