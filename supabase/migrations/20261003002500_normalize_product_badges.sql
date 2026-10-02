/* Normalize badges so the database matches the frontend model. */

ALTER TABLE public.products
  ALTER COLUMN badges DROP DEFAULT;

ALTER TABLE public.products
  ALTER COLUMN badges TYPE text[]
  USING CASE
    WHEN badges IS NULL OR btrim(badges) = '' THEN NULL
    ELSE ARRAY[badges]
  END;

ALTER TABLE public.products
  ALTER COLUMN badges SET DEFAULT ARRAY[]::text[];
