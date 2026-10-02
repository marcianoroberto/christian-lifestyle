import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@/lib/supabase';
import { formatVariantOptions, getProductBadges, supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, Heart, Truck, Shield, RefreshCw } from 'lucide-react';

type ProductModalProps = {
  productId: string | null;
  onClose: () => void;
};

export default function ProductModal({ productId, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setVariants([]);
      setSelectedVariantId(null);
      setLoading(true);
      return;
    }

    let cancelled = false;

    async function fetchProductAndVariants() {
      setLoading(true);
      setQuantity(1);

      const [{ data: productData, error: productError }, { data: variantData, error: variantError }] = await Promise.all([
        supabase.from('products').select('*').eq('id', productId).maybeSingle(),
        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (cancelled) return;

      if (productError) console.error('Error fetching product:', productError);
      if (variantError) console.error('Error fetching product variants:', variantError);

      const nextProduct = productData as Product | null;
      const nextVariants = (variantData ?? []) as ProductVariant[];
      const firstAvailable = nextVariants.find((variant) => variant.is_available) ?? nextVariants[0] ?? null;

      setProduct(nextProduct);
      setVariants(nextVariants);
      setSelectedVariantId(firstAvailable?.id ?? null);
      setLoading(false);
    }

    void fetchProductAndVariants();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  );

  if (!productId) return null;

  const badges = getProductBadges(product?.badges ?? null);
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const comparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price ?? null;
  const variantLabel = selectedVariant ? formatVariantOptions(selectedVariant) : '';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 opacity-100" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={product?.name ?? 'Productdetails'}
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
                    src={selectedVariant?.image_url || product.image_url}
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

                  <h2 className="text-2xl font-bold text-stone-800 leading-tight">{product.name}</h2>

                  <div className="flex items-baseline gap-3 mt-3">
                    <p className="text-2xl font-bold text-amber-800">{formatPrice(displayPrice)}</p>
                    {comparePrice && comparePrice > displayPrice && (
                      <p className="text-base text-stone-400 line-through">{formatPrice(comparePrice)}</p>
                    )}
                  </div>

                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {badges.map((badge) => (
                        <span key={badge} className="px-2.5 py-1 bg-stone-900 text-white text-xs font-semibold rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-stone-600 mt-4 leading-relaxed text-sm">{product.description}</p>

                  {variants.length > 1 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-stone-700 mb-2">Kies een variant</p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={!variant.is_available}
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                              selectedVariantId === variant.id
                                ? 'border-amber-800 bg-amber-50 text-amber-900'
                                : 'border-stone-200 text-stone-700 hover:border-stone-400'
                            } ${!variant.is_available ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                          >
                            {formatVariantOptions(variant) || variant.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {variants.length === 1 && variantLabel && (
                    <p className="text-sm text-stone-500 mt-4">{variantLabel}</p>
                  )}

                  {selectedVariant && !selectedVariant.is_available && (
                    <p className="mt-4 text-sm font-medium text-red-600">Deze variant is momenteel niet beschikbaar.</p>
                  )}

                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center border border-stone-200 rounded-full">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-stone-600 hover:text-amber-800 transition-colors" aria-label="Aantal verminderen">–</button>
                      <span className="px-4 text-sm font-medium text-stone-800">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-stone-600 hover:text-amber-800 transition-colors" aria-label="Aantal verhogen">+</button>
                    </div>
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="w-11 h-11 rounded-full border border-stone-200 flex items-center justify-center hover:border-red-300 transition-colors"
                      aria-label="Favoriet"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-stone-400'}`} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <button
                    disabled={!selectedVariant || !selectedVariant.is_available}
                    onClick={() => {
                      if (!selectedVariant) return;
                      addToCart(product, selectedVariant, quantity);
                      onClose();
                    }}
                    className="mt-6 w-full py-3.5 bg-amber-800 text-white font-semibold rounded-full hover:bg-amber-900 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Toevoegen aan winkelmandje
                  </button>

                  <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-100">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <Truck className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">Verzendinformatie bij checkout</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <Shield className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">Veilige betaalomgeving</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <RefreshCw className="w-5 h-5 text-amber-700" />
                      <span className="text-xs text-stone-500">Retourvoorwaarden volgen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500">Product niet gevonden.</div>
          )}
        </div>
      </div>
    </>
  );
}
