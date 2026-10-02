import { useEffect, useState } from 'react';
import { supabase, type Product, getProductBadges } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { ShoppingCart, Heart } from 'lucide-react';

type ProductGridProps = {
  category?: string;
  gender?: string;
  showFeatured?: boolean;
  onProductClick?: (product: Product) => void;
};

export default function ProductGrid({ category, gender, showFeatured, onProductClick }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from('products').select('*').eq('in_stock', true);
      if (showFeatured) query = query.eq('featured', true);
      if (category && category !== 'all') query = query.eq('category', category);
      if (gender && gender !== 'all') query = query.eq('gender', gender);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) console.error('Error fetching products:', error);
      else if (data) setProducts(data as Product[]);
      setLoading(false);
    }

    void fetchProducts();
  }, [category, gender, showFeatured]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-stone-100 rounded-2xl aspect-[3/4] animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <div className="text-center py-16"><p className="text-stone-500 text-lg">Geen producten gevonden.</p></div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        const badges = getProductBadges(product.badges);

        return (
          <div
            key={product.id}
            className={`group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onProductClick ? 'cursor-pointer' : ''}`}
            onClick={() => onProductClick?.(product)}
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                aria-label="Favoriet"
              >
                <Heart className={`w-4 h-4 transition-colors ${favorites.has(product.id) ? 'text-red-500' : 'text-stone-400'}`} fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
              </button>
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.featured && <span className="px-2.5 py-1 bg-amber-800 text-white text-xs font-semibold rounded-full">Uitgelicht</span>}
                {product.compare_at_price && product.compare_at_price > product.price && <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">Aanbieding</span>}
                {badges.map((badge) => <span key={badge} className="px-2.5 py-1 bg-stone-900 text-white text-xs font-semibold rounded-full">{badge}</span>)}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-stone-800 text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-amber-800">{formatPrice(product.price)}</span>
                  {product.compare_at_price && product.compare_at_price > product.price && <span className="text-xs text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick?.(product);
                  }}
                  className="w-9 h-9 bg-stone-800 hover:bg-amber-800 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  aria-label="Product bekijken en variant kiezen"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
