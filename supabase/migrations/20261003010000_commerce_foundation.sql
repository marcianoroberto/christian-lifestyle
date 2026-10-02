/*
# Commerce foundation before Stripe

This migration implements:
1. Product variants as the canonical sellable unit.
2. Internal inventory and fulfilment state.
3. Supplier data isolated from the public catalog.
4. Order and order-item tables ready for server-side checkout/webhooks.
5. Automatic default variants for newly created products.

IMPORTANT:
- Browser/cart prices remain display-only. A future checkout endpoint must load
  current variant prices from the database server-side.
- Supplier/inventory/order tables are never readable by anonymous visitors.
- Stripe is intentionally NOT introduced in this migration.
*/

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Product variants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text UNIQUE,
  title text NOT NULL DEFAULT 'Standaard',
  option_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(option_values) = 'object')
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_catalog_idx
  ON public.product_variants(product_id, is_active, sort_order);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_variants" ON public.product_variants;
CREATE POLICY "public_read_active_variants"
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "admin_read_all_variants" ON public.product_variants;
CREATE POLICY "admin_read_all_variants"
  ON public.product_variants
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_variants" ON public.product_variants;
CREATE POLICY "admin_insert_variants"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_variants" ON public.product_variants;
CREATE POLICY "admin_update_variants"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_variants" ON public.product_variants;
CREATE POLICY "admin_delete_variants"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Existing products receive one safe default variant first.
INSERT INTO public.product_variants (
  product_id,
  title,
  option_values,
  price,
  compare_at_price,
  image_url,
  is_active,
  is_available,
  sort_order
)
SELECT
  p.id,
  'Standaard',
  '{}'::jsonb,
  p.price,
  p.compare_at_price,
  p.image_url,
  true,
  p.in_stock,
  0
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id
);

-- Convert known launch products with actual choices into explicit variants.
-- This is idempotent: it only replaces the single default variant.
DO $$
DECLARE
  product_row record;
BEGIN
  FOR product_row IN
    SELECT p.*
    FROM public.products p
    WHERE p.name IN (
      'Stoere RVS Herenketting met Kruis',
      'Be Strong & Courageous Bijbelhoes',
      'Cross Jesus Ketting',
      'God is Greater Ring'
    )
    AND (
      SELECT count(*) FROM public.product_variants pv WHERE pv.product_id = p.id
    ) = 1
    AND EXISTS (
      SELECT 1 FROM public.product_variants pv
      WHERE pv.product_id = p.id AND pv.title = 'Standaard'
    )
  LOOP
    DELETE FROM public.product_variants WHERE product_id = product_row.id;

    IF product_row.name = 'Stoere RVS Herenketting met Kruis' THEN
      INSERT INTO public.product_variants (product_id, title, option_values, price, compare_at_price, image_url, is_available, sort_order)
      VALUES
        (product_row.id, 'Goud',   '{"Kleur":"Goud"}'::jsonb,   product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 1),
        (product_row.id, 'Zilver', '{"Kleur":"Zilver"}'::jsonb, product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 2),
        (product_row.id, 'Zwart',  '{"Kleur":"Zwart"}'::jsonb,  product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 3);
    ELSIF product_row.name = 'Be Strong & Courageous Bijbelhoes' THEN
      INSERT INTO public.product_variants (product_id, title, option_values, price, compare_at_price, image_url, is_available, sort_order)
      VALUES
        (product_row.id, 'M',  '{"Maat":"M"}'::jsonb,  product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 1),
        (product_row.id, 'L',  '{"Maat":"L"}'::jsonb,  product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 2),
        (product_row.id, 'XL', '{"Maat":"XL"}'::jsonb, product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 3);
    ELSIF product_row.name = 'Cross Jesus Ketting' THEN
      INSERT INTO public.product_variants (product_id, title, option_values, price, compare_at_price, image_url, is_available, sort_order)
      VALUES
        (product_row.id, 'Goud',   '{"Kleur":"Goud"}'::jsonb,   product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 1),
        (product_row.id, 'Zilver', '{"Kleur":"Zilver"}'::jsonb, product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 2);
    ELSIF product_row.name = 'God is Greater Ring' THEN
      INSERT INTO public.product_variants (product_id, title, option_values, price, compare_at_price, image_url, is_available, sort_order)
      VALUES
        (product_row.id, 'Goud / maat 11',   '{"Kleur":"Goud","Maat":"11"}'::jsonb,   product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 1),
        (product_row.id, 'Goud / maat 12',   '{"Kleur":"Goud","Maat":"12"}'::jsonb,   product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 2),
        (product_row.id, 'Zilver / maat 11', '{"Kleur":"Zilver","Maat":"11"}'::jsonb, product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 3),
        (product_row.id, 'Zilver / maat 12', '{"Kleur":"Zilver","Maat":"12"}'::jsonb, product_row.price, product_row.compare_at_price, product_row.image_url, product_row.in_stock, 4);
    END IF;
  END LOOP;
END $$;

-- Automatically create a default sellable variant for future products.
CREATE OR REPLACE FUNCTION public.create_default_product_variant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.product_variants WHERE product_id = NEW.id
  ) THEN
    INSERT INTO public.product_variants (
      product_id, title, option_values, price, compare_at_price,
      image_url, is_active, is_available, sort_order
    ) VALUES (
      NEW.id, 'Standaard', '{}'::jsonb, NEW.price, NEW.compare_at_price,
      NEW.image_url, true, NEW.in_stock, 0
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_create_default_variant ON public.products;
CREATE TRIGGER products_create_default_variant
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.create_default_product_variant();

-- ---------------------------------------------------------------------------
-- 2. Internal inventory / fulfilment state
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.variant_inventory (
  variant_id uuid PRIMARY KEY REFERENCES public.product_variants(id) ON DELETE CASCADE,
  stock_mode text NOT NULL DEFAULT 'untracked'
    CHECK (stock_mode IN ('own_stock', 'supplier_stock', 'made_to_order', 'untracked', 'limited_supplier')),
  quantity_on_hand integer CHECK (quantity_on_hand IS NULL OR quantity_on_hand >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  supplier_quantity integer CHECK (supplier_quantity IS NULL OR supplier_quantity >= 0),
  supplier_in_stock boolean,
  allow_backorder boolean NOT NULL DEFAULT false,
  low_stock_threshold integer NOT NULL DEFAULT 2 CHECK (low_stock_threshold >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity_on_hand IS NULL OR quantity_reserved <= quantity_on_hand OR allow_backorder)
);

ALTER TABLE public.variant_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_inventory" ON public.variant_inventory;
CREATE POLICY "admin_read_inventory"
  ON public.variant_inventory FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_inventory" ON public.variant_inventory;
CREATE POLICY "admin_insert_inventory"
  ON public.variant_inventory FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_inventory" ON public.variant_inventory;
CREATE POLICY "admin_update_inventory"
  ON public.variant_inventory FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_inventory" ON public.variant_inventory;
CREATE POLICY "admin_delete_inventory"
  ON public.variant_inventory FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS variant_inventory_set_updated_at ON public.variant_inventory;
CREATE TRIGGER variant_inventory_set_updated_at
  BEFORE UPDATE ON public.variant_inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Internal stock ledger. Positive/negative quantity_delta records what changed.
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  order_id uuid,
  movement_type text NOT NULL
    CHECK (movement_type IN ('adjustment', 'reservation', 'release', 'sale', 'return', 'supplier_sync')),
  quantity_delta integer NOT NULL CHECK (quantity_delta <> 0),
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_inventory_movements"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin_insert_inventory_movements"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Derive the public availability flag from private inventory state.
CREATE OR REPLACE FUNCTION public.sync_variant_availability_from_inventory()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  inventory_row public.variant_inventory%ROWTYPE;
  available boolean;
  target_variant uuid;
BEGIN
  target_variant := COALESCE(NEW.variant_id, OLD.variant_id);

  IF TG_OP = 'DELETE' THEN
    UPDATE public.product_variants SET is_available = true WHERE id = target_variant;
    RETURN OLD;
  END IF;

  inventory_row := NEW;
  available := CASE inventory_row.stock_mode
    WHEN 'own_stock' THEN
      inventory_row.allow_backorder OR (COALESCE(inventory_row.quantity_on_hand, 0) - inventory_row.quantity_reserved > 0)
    WHEN 'supplier_stock' THEN
      inventory_row.allow_backorder OR (
        COALESCE(inventory_row.supplier_in_stock, false)
        AND (inventory_row.supplier_quantity IS NULL OR inventory_row.supplier_quantity > 0)
      )
    WHEN 'limited_supplier' THEN
      inventory_row.allow_backorder OR (
        COALESCE(inventory_row.supplier_in_stock, false)
        AND COALESCE(inventory_row.supplier_quantity, 1) > 0
      )
    WHEN 'made_to_order' THEN true
    WHEN 'untracked' THEN true
    ELSE false
  END;

  UPDATE public.product_variants
  SET is_available = available
  WHERE id = target_variant;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_sync_variant_availability ON public.variant_inventory;
CREATE TRIGGER inventory_sync_variant_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.variant_inventory
  FOR EACH ROW EXECUTE FUNCTION public.sync_variant_availability_from_inventory();

-- Keep public products.price / in_stock as a catalog summary for cards.
CREATE OR REPLACE FUNCTION public.refresh_product_catalog_summary(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET
    price = COALESCE((
      SELECT min(pv.price)
      FROM public.product_variants pv
      WHERE pv.product_id = p_product_id AND pv.is_active = true
    ), p.price),
    compare_at_price = (
      SELECT min(pv.compare_at_price)
      FROM public.product_variants pv
      WHERE pv.product_id = p_product_id
        AND pv.is_active = true
        AND pv.compare_at_price IS NOT NULL
    ),
    in_stock = COALESCE((
      SELECT bool_or(pv.is_available)
      FROM public.product_variants pv
      WHERE pv.product_id = p_product_id AND pv.is_active = true
    ), false)
  WHERE p.id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.product_variants_refresh_product_summary()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_product_catalog_summary(COALESCE(NEW.product_id, OLD.product_id));
  IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    PERFORM public.refresh_product_catalog_summary(OLD.product_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS product_variants_refresh_product_summary ON public.product_variants;
CREATE TRIGGER product_variants_refresh_product_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.product_variants_refresh_product_summary();

-- Seed inventory mode for existing variants.
INSERT INTO public.variant_inventory (
  variant_id, stock_mode, quantity_on_hand, supplier_quantity,
  supplier_in_stock, allow_backorder
)
SELECT
  pv.id,
  CASE
    WHEN p.name = 'Jesus Christ Houten Wandbord' THEN 'made_to_order'
    WHEN p.name = 'Bordje Gedoopt' THEN 'made_to_order'
    WHEN p.name = 'God is Greater Ring' THEN 'limited_supplier'
    WHEN p.name IN (
      'Stoere RVS Herenketting met Kruis',
      'Tegeltje Geloof Hoop Liefde',
      'Love Never Fails Bijbeltas',
      'Man van God Poster',
      'Be Strong & Courageous Bijbelhoes',
      'Cross Jesus Ketting',
      'Gods Meesterwerk Babymuts'
    ) THEN 'supplier_stock'
    ELSE 'untracked'
  END,
  NULL,
  NULL,
  p.in_stock,
  false
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
ON CONFLICT (variant_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Suppliers and private supplier-product mapping
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  website_url text,
  contact_email text,
  country_code text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin_insert_suppliers"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_suppliers"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_suppliers"
  ON public.suppliers FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS suppliers_set_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_set_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.supplier_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  supplier_sku text,
  supplier_product_url text,
  fulfilment_mode text NOT NULL DEFAULT 'wholesale'
    CHECK (fulfilment_mode IN ('dropship', 'wholesale', 'made_to_order', 'own_stock')),
  cost_price numeric(10,2) CHECK (cost_price IS NULL OR cost_price >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (char_length(currency) = 3),
  production_country_code text,
  assembly_country_code text,
  origin_verified boolean NOT NULL DEFAULT false,
  lead_time_days integer CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  is_primary boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, variant_id)
);

CREATE INDEX IF NOT EXISTS supplier_variants_variant_id_idx
  ON public.supplier_variants(variant_id);

ALTER TABLE public.supplier_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_supplier_variants"
  ON public.supplier_variants FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin_insert_supplier_variants"
  ON public.supplier_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_supplier_variants"
  ON public.supplier_variants FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_supplier_variants"
  ON public.supplier_variants FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS supplier_variants_set_updated_at ON public.supplier_variants;
CREATE TRIGGER supplier_variants_set_updated_at
  BEFORE UPDATE ON public.supplier_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Known initial suppliers. These rows are internal and never public catalog data.
INSERT INTO public.suppliers (name, website_url, country_code)
VALUES
  ('3:16 Europe', 'https://www.316europe.nl', 'NL'),
  ('Bron van Hout', 'https://bronvanhout.nl', 'NL'),
  ('Grace & Praise', 'https://www.grace-and-praise.nl', 'NL'),
  ('Christelijke Sieraden', 'https://www.christelijkesieraden.nl', 'NL')
ON CONFLICT (name) DO NOTHING;

-- Map the current launch products to suppliers without exposing the mapping publicly.
INSERT INTO public.supplier_variants (
  supplier_id, variant_id, supplier_sku, supplier_product_url,
  fulfilment_mode, currency, is_primary, active
)
SELECT
  s.id,
  pv.id,
  CASE p.name
    WHEN 'Love Never Fails Bijbeltas' THEN '1220000138957'
    WHEN 'Be Strong & Courageous Bijbelhoes' THEN '1220000130135'
    WHEN 'Gods Meesterwerk Babymuts' THEN '3162025070066'
    ELSE NULL
  END,
  CASE p.name
    WHEN 'Love Never Fails Bijbeltas' THEN 'https://www.316europe.nl/collections/gift-bag/products/tote-bible-bag-32-x-8-x-30-cm-love-never-fails-black-and-heather-1220000138957'
    WHEN 'Be Strong & Courageous Bijbelhoes' THEN 'https://www.316europe.nl/collections/gift-biblecovers/products/biblecover-large-168-x-241-x-50-mm-be-strong-and-courageous-luxleather-1220000130135'
    WHEN 'Gods Meesterwerk Babymuts' THEN 'https://www.316europe.nl/collections/gift-clothing/products/gods-meesterwerk-leeuw-babymutsje'
  END,
  'dropship',
  'EUR',
  true,
  true
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
JOIN public.suppliers s ON s.name = '3:16 Europe'
WHERE p.name IN ('Love Never Fails Bijbeltas', 'Be Strong & Courageous Bijbelhoes', 'Gods Meesterwerk Babymuts')
ON CONFLICT (supplier_id, variant_id) DO NOTHING;

INSERT INTO public.supplier_variants (
  supplier_id, variant_id, supplier_product_url, fulfilment_mode, currency
)
SELECT
  s.id,
  pv.id,
  CASE p.name
    WHEN 'Tegeltje Geloof Hoop Liefde' THEN 'https://bronvanhout.nl/product/tegeltje-van-hout-geloof-hoop-liefde/'
    WHEN 'Man van God Poster' THEN 'https://bronvanhout.nl/product/man-van-god-poster/'
    WHEN 'Jesus Christ Houten Wandbord' THEN 'https://bronvanhout.nl/product/jesus-christ/'
  END,
  CASE WHEN p.name = 'Jesus Christ Houten Wandbord' THEN 'made_to_order' ELSE 'wholesale' END,
  'EUR'
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
JOIN public.suppliers s ON s.name = 'Bron van Hout'
WHERE p.name IN ('Tegeltje Geloof Hoop Liefde', 'Man van God Poster', 'Jesus Christ Houten Wandbord')
ON CONFLICT (supplier_id, variant_id) DO NOTHING;

INSERT INTO public.supplier_variants (
  supplier_id, variant_id, supplier_product_url, fulfilment_mode, currency
)
SELECT
  s.id,
  pv.id,
  CASE p.name
    WHEN 'Stoere RVS Herenketting met Kruis' THEN 'https://www.grace-and-praise.nl/p/ketting-kruis-in-3-maten-3-5cm-ketting-kruis-in-3-maten-zilver/'
    WHEN 'Cross Jesus Ketting' THEN 'https://www.grace-and-praise.nl/p/ketting-cross-jesus-in-3-kleuren/'
    WHEN 'God is Greater Ring' THEN 'https://www.grace-and-praise.nl/p/ring-god-is-greater-in-drie-kleuren/'
  END,
  'wholesale',
  'EUR'
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
JOIN public.suppliers s ON s.name = 'Grace & Praise'
WHERE p.name IN ('Stoere RVS Herenketting met Kruis', 'Cross Jesus Ketting', 'God is Greater Ring')
ON CONFLICT (supplier_id, variant_id) DO NOTHING;

INSERT INTO public.supplier_variants (
  supplier_id, variant_id, supplier_product_url, fulfilment_mode, currency
)
SELECT
  s.id,
  pv.id,
  'https://www.christelijkesieraden.nl/product/13931226/bordje-gedoopt',
  'made_to_order',
  'EUR'
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
JOIN public.suppliers s ON s.name = 'Christelijke Sieraden'
WHERE p.name = 'Bordje Gedoopt'
ON CONFLICT (supplier_id, variant_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Orders / order lines (server-side checkout ready, no public writes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint GENERATED BY DEFAULT AS IDENTITY UNIQUE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_payment', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded', 'failed')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_refunded', 'refunded', 'failed')),
  fulfilment_status text NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfilment_status IN ('unfulfilled', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled')),
  currency text NOT NULL DEFAULT 'EUR' CHECK (char_length(currency) = 3),
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  billing_address jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_provider text,
  provider_session_id text UNIQUE,
  provider_payment_id text UNIQUE,
  notes text,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin_insert_orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_orders"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_title text NOT NULL,
  sku text,
  option_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  supplier_sku text,
  fulfilment_mode text
    CHECK (fulfilment_mode IS NULL OR fulfilment_mode IN ('dropship', 'wholesale', 'made_to_order', 'own_stock')),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(option_values) = 'object')
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_variant_id_idx ON public.order_items(variant_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_order_items"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin_insert_order_items"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_order_items"
  ON public.order_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_order_items"
  ON public.order_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- Add the FK now that orders exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_movements_order_id_fkey'
  ) THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Explicit grants; RLS still controls what each role can actually access.
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.variant_inventory TO authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- Recalculate current catalog summaries after the seed.
DO $$
DECLARE
  product_id_to_refresh uuid;
BEGIN
  FOR product_id_to_refresh IN SELECT id FROM public.products LOOP
    PERFORM public.refresh_product_catalog_summary(product_id_to_refresh);
  END LOOP;
END $$;
