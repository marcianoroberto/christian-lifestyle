import { useEffect, useState } from 'react';
import type { Product } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, Heart, Truck, Shield, RefreshCw } from 'lucide-react';

type ProductModalProps = {
  productId: string | null;
  onClose: () => void;
};

export default function ProductModal({ productId, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(true);
      return;
    }
    setLoading(true);
    setQuantity(1);
    supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching product:', error);
        }
        setProduct(data as Product | null);
        setLoading(false);
      });
  }, [productId]);

  if (!productId) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          productId ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 ${
            productId ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : product ? (
            <div className="relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>

              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-square md:aspect-auto bg-stone-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 sm:p-8 flex flex-col">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full w-fit mb-3">
                    {product.category === 'sieraden'
                      ? 'Sieraden'
                      : product.category === 'wonen-inspiratie'
                      ? 'Wonen & inspiratie'
                      : product.category === 'bijbel-onderweg'
                      ? 'Bijbel & onderweg'
                      : product.category === 'baby-kinderen'
                      ? 'Baby & kinderen'
                      : product.category === 'doop-gelegenheden'
                      ? 'Doop & gelegenheden'
                      : product.category}
                  </span>

                  <h2 className="text-2xl font-bold text-stone-800 leading-tight">
                    {product.name}
                  </h2>

                  <div className="flex items-baseline gap-3 mt-3">
                    <p className="text-2xl font-bold text-amber-800">
                      {formatPrice(product.price)}
                    </p>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <p className="text-base text-stone-400 line-through">
                        {formatPrice(product.compare_at_price)}
                      </p>
                    )}
                  </div>
                  {product.badges && product.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {product.badges.map((badge) => (
                        <span key={badge} className="px-2.5 py-1 bg-stone-900 text-white text-xs font-semibold rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-stone-600 mt-4 leading-relaxed text-sm">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center border border-stone-200 rounded-full">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-stone-600 hover:text-amber-800 transition-colors"
                      >
                        –
                      </button>
                      <span className="px-4 text-sm font-medium text-stone-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 text-stone-600 hover:text-amber-800 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="w-11 h-11 rounded-full border border-stone-200 flex items-center justify-center hover:border-red-300 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? 'text-red-500' : 'text-stone-400'
                        }`}
                        fill={isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, quantity);
                      onClose();
                    }}
                    className="mt-6 w-full py-3.5 bg-amber-800 text-white font-semibold rounded-full hover:bg-amber-900 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Toevoegen aan winkelmandje
                  </button>

                  <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-100">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <Truck className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">Gratis verzending</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <Shield className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">Veilig betalen</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <RefreshCw className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">30 dagen ruilen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500">
              Product niet gevonden.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
