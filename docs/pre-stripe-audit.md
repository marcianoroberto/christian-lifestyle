# Christian Lifestyle — pre-Stripe audit

This branch contains the first foundation fixes before a Stripe integration is added.

## Critical findings

1. **Admin authorization was too broad.**
   Any authenticated Supabase user could write to `products` and `site_settings`. Because the UI also offered public sign-up, a visitor could potentially create an account and modify the catalog.

2. **Client prices cannot be trusted at checkout.**
   The cart stores full product objects and prices in `localStorage`. That is acceptable for display, but Stripe checkout must be created server-side from product/variant IDs and quantities. The server must re-read authoritative prices from the database.

3. **Product variants are not modelled yet.**
   Products such as rings, necklaces and Bible covers need color/size selections. A variant-aware cart and inventory model must be implemented before checkout.

4. **`badges` schema/type mismatch.**
   The migration creates `badges` as `text`, while TypeScript expected `string[]`. UI code calling `.map()` can fail at runtime. This branch makes the frontend tolerant; the database should later be normalized to an array/JSON representation.

5. **Inventory is only a boolean.**
   `in_stock` is insufficient for own stock, supplier stock, made-to-order and dropship products. Inventory needs a proper model before automated checkout/fulfilment.

6. **Commercial/legal claims are currently hard-coded.**
   Shipping thresholds, payment methods and return promises are shown even though payment/fulfilment is not live yet. These must be confirmed and centralized before launch.

7. **Supplier/internal metadata must not become public catalog data.**
   Supplier URLs, wholesale references/costs and internal fulfilment notes should be stored in an admin-only table, not in a publicly selectable `products` row.

8. **Product pages currently use a modal rather than stable URLs.**
   This is acceptable for prototyping, but proper product routes are preferable before launch for SEO, sharing and analytics.

## Admin bootstrap after security migration

The migration `20261003002000_secure_admin_access.sql` deliberately does not make every existing user an admin.

After the migration is applied, run this once in the Supabase SQL editor with the intended admin email:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

Do not put this operation in browser code.

## Required Stripe architecture

Use this flow:

1. Browser sends only product/variant IDs and quantities to a server-side checkout endpoint.
2. Server re-reads products/variants and authoritative prices from the database.
3. Server validates saleability/stock and creates the Stripe Checkout Session.
4. Stripe webhook verifies payment server-side.
5. Only the verified webhook creates/finalizes the paid order and adjusts/reserves inventory.
6. Fulfilment/dropship state is handled after payment confirmation.

Never send a Stripe secret key to the browser and never accept a cart total supplied by the browser as authoritative.

## Recommended next data model

Keep public catalog and internal supplier data separate.

### Public
- products
- product_variants
- public availability
- retail prices
- customer-facing descriptions/images

### Admin only
- product_supplier_data
- supplier SKU and supplier URL
- purchase cost
- fulfilment method
- stock sync configuration
- internal notes

### Commerce
- orders
- order_items (immutable price/name snapshots)
- payments / Stripe identifiers
- fulfilment status
- inventory movements or reservations

## Before live launch

- Replace/remove unverified claims such as shipping thresholds and payment methods.
- Add privacy policy, terms, returns/cancellation information and required company/contact details.
- Use a business contact channel rather than a minor's personal email address.
- Confirm image/licensing permission for supplier product photos.
- Add stable product URLs and metadata.
- Test mobile cart/checkout and accessibility.
