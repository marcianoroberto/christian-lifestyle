import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string;
  category: string;
  gender: string;
  badges: string | string[] | null;
  featured: boolean;
  in_stock: boolean;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  title: string;
  option_values: Record<string, string>;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_active: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type VariantInventory = {
  variant_id: string;
  stock_mode: 'own_stock' | 'supplier_stock' | 'made_to_order' | 'untracked' | 'limited_supplier';
  quantity_on_hand: number | null;
  quantity_reserved: number;
  supplier_quantity: number | null;
  supplier_in_stock: boolean | null;
  allow_backorder: boolean;
  low_stock_threshold: number;
  updated_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  website_url: string | null;
  contact_email: string | null;
  country_code: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierVariant = {
  id: string;
  supplier_id: string;
  variant_id: string;
  supplier_sku: string | null;
  supplier_product_url: string | null;
  fulfilment_mode: 'dropship' | 'wholesale' | 'made_to_order' | 'own_stock';
  cost_price: number | null;
  currency: string;
  production_country_code: string | null;
  assembly_country_code: string | null;
  origin_verified: boolean;
  lead_time_days: number | null;
  is_primary: boolean;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: number;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'fulfilled' | 'cancelled' | 'refunded' | 'failed';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';
  fulfilment_status: 'unfulfilled' | 'processing' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_provider: string | null;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  notes: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  supplier_id: string | null;
  product_name: string;
  variant_title: string;
  sku: string | null;
  option_values: Record<string, string>;
  supplier_sku: string | null;
  fulfilment_mode: 'dropship' | 'wholesale' | 'made_to_order' | 'own_stock' | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export function getProductBadges(badges: Product['badges']): string[] {
  if (!badges) return [];
  if (Array.isArray(badges)) return badges.filter(Boolean);

  const value = badges.trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
  } catch {
    // Existing rows may contain a simple single badge string.
  }

  return [value];
}

export function formatVariantOptions(variant: ProductVariant): string {
  const entries = Object.entries(variant.option_values ?? {});
  if (entries.length === 0) return variant.title === 'Standaard' ? '' : variant.title;
  return entries.map(([key, value]) => `${key}: ${value}`).join(' · ');
}

export type SiteSettings = {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_bg_url: string;
  hero_image_1: string;
  hero_image_2: string;
  hero_image_3: string;
  hero_image_4: string;
  updated_at: string;
};
