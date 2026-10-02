import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  badges: string[] | null;
  featured: boolean;
  in_stock: boolean;
  created_at: string;
};

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
