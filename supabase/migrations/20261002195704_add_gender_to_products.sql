/*
# Add gender column to products

1. Changes
- Add `gender` column to `products` table (text, default 'unisex')
- Values: 'dames', 'heren', 'unisex'

2. Notes
- Allows filtering products by women's / men's / unisex sections
- Existing products get 'unisex' as default
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unisex';
