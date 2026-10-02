/*
# Create site_settings table for customizable homepage

1. New Tables
- `site_settings`
  - `id` (int, primary key, always 1 — singleton row)
  - `hero_title` (text) — main heading on homepage
  - `hero_subtitle` (text) — subtext on homepage
  - `hero_bg_url` (text) — optional background image URL for hero section
  - `hero_image_1` (text) — optional product image 1
  - `hero_image_2` (text) — optional product image 2
  - `hero_image_3` (text) — optional product image 3
  - `hero_image_4` (text) — optional product image 4
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `site_settings`.
- SELECT: anon + authenticated (public reads).
- INSERT/UPDATE/DELETE: authenticated only (admin manages settings).

3. Notes
- Seeds a default row with id=1.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title text NOT NULL DEFAULT 'Draag je geloof met trots en stijl',
  hero_subtitle text NOT NULL DEFAULT 'Ontdek onze collectie christelijke shirts, sieraden en accessoires. Elk stuk is met liefde gemaakt om je geloof te delen.',
  hero_bg_url text DEFAULT '',
  hero_image_1 text DEFAULT '',
  hero_image_2 text DEFAULT '',
  hero_image_3 text DEFAULT '',
  hero_image_4 text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON site_settings;
CREATE POLICY "anon_select_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON site_settings;
CREATE POLICY "admin_insert_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_settings" ON site_settings;
CREATE POLICY "admin_update_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_settings" ON site_settings;
CREATE POLICY "admin_delete_settings" ON site_settings FOR DELETE
  TO authenticated USING (true);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
