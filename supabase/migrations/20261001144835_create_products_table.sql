/*
# Create products table for Christian webshop

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name
  - `description` (text, not null) — product description
  - `price` (numeric(10,2), not null) — product price in EUR
  - `image_url` (text, not null) — main product image URL
  - `category` (text, not null) — product category: 'shirts', 'jewelry', 'accessories'
  - `featured` (boolean, default false) — whether to show on homepage
  - `in_stock` (boolean, default true) — whether the product is available
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `products`.
- Allow anon + authenticated to read products (public catalog).
- Allow anon + authenticated to insert/update/delete (admin-style, single-tenant demo).

3. Notes
- This is a single-tenant app with no sign-in screen, so all policies use `TO anon, authenticated`.
- The cart is stored client-side in localStorage, no database table needed for cart.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'accessories',
  featured boolean NOT NULL DEFAULT false,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);
