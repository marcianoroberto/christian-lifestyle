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

export type CartItem = {
  product: Product;
  quantity: number;
};

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
