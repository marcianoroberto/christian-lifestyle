# Christian Lifestyle — pre-Stripe foundation

This branch contains the security and commerce foundation that should exist before Stripe is added.

## Implemented

### 1. Product + variant model

`products` remains the public product-level catalog row. `product_variants` is now the canonical sellable unit.

A variant contains:
- product reference
- optional SKU
- customer-facing variant title
- structured option values (`jsonb`), e.g. `{ "Kleur": "Zilver", "Maat": "12" }`
- retail price and compare-at price
- optional variant image
- active/available state
- sort order

Existing products automatically receive a default variant. Known launch products with size/color choices are seeded with explicit variants.

Newly created products automatically receive a default variant so old admin flows keep working until variant management is added to the admin UI.

### 2. Inventory + fulfilment model

`variant_inventory` stores internal stock state per variant. Supported modes:
- `own_stock`
- `supplier_stock`
- `made_to_order`
- `limited_supplier`
- `untracked`

It stores own-stock quantities, reserved quantities, optional supplier quantities, supplier availability, backorder behaviour and low-stock thresholds.

The public `product_variants.is_available` flag is derived from this private inventory state. Customers therefore see availability without seeing internal stock details.

`inventory_movements` provides an internal ledger for future reservations, sales, returns, supplier syncs and manual adjustments.

### 3. Suppliers separated from the public catalog

Supplier information is stored in admin-only tables:
- `suppliers`
- `supplier_variants`

This includes supplier SKU, supplier URL, fulfilment mode, cost price, production/assembly country, origin-verification status, lead time and internal notes.

Anonymous users have no RLS policy that exposes these tables.

Initial mappings are seeded for 3:16 Europe, Bron van Hout, Grace & Praise and Christelijke Sieraden.

### 4. Variant-aware cart

The browser cart now identifies cart lines by `variant.id`, not by `product.id`.

That means different colors/sizes of the same product remain separate lines. The product modal loads active variants, requires an explicit choice when needed and prevents unavailable variants from being added.

The old cart localStorage key was replaced with a v2 key so incompatible pre-variant cart data is not reused.

Important: browser prices are display-only. They remain untrusted for payment.

### 5. Orders and order lines

`orders` and `order_items` are now present for the future server-side checkout/webhook flow.

Orders track:
- order/payment/fulfilment status
- customer + address snapshots
- subtotal/shipping/discount/tax/total
- payment-provider identifiers
- paid/fulfilled timestamps

Order items snapshot:
- product and variant identifiers
- product/variant names at purchase time
- SKU and option values
- supplier/fulfilment information
- quantity
- authoritative unit price
- generated line total

Anonymous users cannot read or write order data.

## Security foundation

### Admin authorization

The original implementation allowed every authenticated Supabase user to write products and site settings. The app also exposed public account creation.

This branch:
- removes public admin sign-up from the frontend;
- introduces `admin_users` as an explicit allow-list;
- adds `public.is_admin()`;
- changes product/site-settings write policies to require that allow-list;
- reuses the same admin rule for variants, inventory, suppliers and orders.

### Admin bootstrap after migration

The migration deliberately does not automatically promote an existing Supabase user.

After migrations are applied, run this once in the Supabase SQL editor with the intended admin email:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

Do not put this operation in browser code.

## Required Stripe architecture — next phase

Stripe should use this flow:

1. Browser sends only variant IDs and quantities.
2. Server loads those variants from Supabase.
3. Server validates `is_active`, `is_available` and authoritative prices.
4. Server rechecks private inventory/fulfilment rules where applicable.
5. Server creates an order in `pending_payment` state and immutable `order_items` snapshots.
6. Server creates the Stripe Checkout Session using database prices, never browser totals.
7. Stripe webhook verifies successful payment server-side.
8. Webhook marks the order paid and performs inventory reservation/sale movements.
9. Fulfilment is routed using the internal supplier/fulfilment mapping.

Never expose a Stripe secret in Vite/client code.

## Remaining before Stripe

The backend foundation for steps 1–5 exists. Useful follow-up work before/alongside Stripe:
- add admin UI for editing variants, inventory and supplier mappings;
- decide exact shipping rules and where shipping cost is calculated;
- add stable product URLs before launch;
- replace remaining placeholder/commercial copy with confirmed policies;
- confirm supplier photo licensing and final retail prices.

## Before live launch

- Add privacy policy, terms, returns/cancellation information and required company/contact details.
- Use a business contact channel rather than a minor's personal email address.
- Confirm image/licensing permission for supplier product photos.
- Add stable product URLs and metadata.
- Test mobile cart/checkout, keyboard navigation and accessibility.
