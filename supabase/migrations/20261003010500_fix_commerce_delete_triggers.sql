/* Make commerce triggers safe for DELETE events where NEW is not available. */

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
  IF TG_OP = 'DELETE' THEN
    target_variant := OLD.variant_id;
    UPDATE public.product_variants SET is_available = true WHERE id = target_variant;
    RETURN OLD;
  END IF;

  target_variant := NEW.variant_id;
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

CREATE OR REPLACE FUNCTION public.product_variants_refresh_product_summary()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  product_to_refresh uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    product_to_refresh := OLD.product_id;
    PERFORM public.refresh_product_catalog_summary(product_to_refresh);
    RETURN OLD;
  END IF;

  product_to_refresh := NEW.product_id;
  PERFORM public.refresh_product_catalog_summary(product_to_refresh);

  IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    PERFORM public.refresh_product_catalog_summary(OLD.product_id);
  END IF;

  RETURN NEW;
END;
$$;
