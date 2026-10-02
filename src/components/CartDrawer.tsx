import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { useState } from 'react';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  const handleCheckout = () => {
    setCheckoutMsg(
      'iDEAL betaling is nog niet geactiveerd. Om iDEAL te ontvangen moet Stripe worden gekoppeld — zie de instructies onderaan.'
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setIsCartOpen(false);
          setCheckoutMsg(null);
        }}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            <h2 className="text-lg font-bold text-stone-800">
              Winkelmandje {totalItems > 0 && `(${totalItems})`}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setCheckoutMsg(null);
            }}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-stone-400" />
            </div>
            <p className="text-stone-500 font-medium">Je winkelmandje is leeg</p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-6 px-6 py-2.5 bg-amber-800 text-white text-sm font-medium rounded-full hover:bg-amber-900 transition-colors"
            >
              Verder winkelen
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 pb-4 border-b border-stone-100 last:border-0"
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stone-800 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-amber-800 font-medium mt-0.5">
                      {formatPrice(item.product.price)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-stone-200 rounded-full">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-stone-100 rounded-l-full transition-colors"
                          aria-label="Minder"
                        >
                          <Minus className="w-3.5 h-3.5 text-stone-600" />
                        </button>
                        <span className="px-3 text-sm font-medium text-stone-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-stone-100 rounded-r-full transition-colors"
                          aria-label="Meer"
                        >
                          <Plus className="w-3.5 h-3.5 text-stone-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-stone-800 flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 px-6 py-4 space-y-3 bg-stone-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Subtotaal</span>
                <span className="text-sm font-medium text-stone-700">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Verzending</span>
                {totalPrice >= 50 ? (
                  <span className="text-sm font-medium text-green-700">Gratis</span>
                ) : (
                  <span className="text-sm font-medium text-stone-700">{formatPrice(4.95)}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <span className="text-base font-bold text-stone-800">Totaal</span>
                <span className="text-base font-bold text-amber-800">
                  {formatPrice(totalPrice >= 50 ? totalPrice : totalPrice + 4.95)}
                </span>
              </div>

              {totalPrice < 50 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  Bestel voor nog {formatPrice(50 - totalPrice)} voor gratis verzending!
                </div>
              )}

              {checkoutMsg && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  {checkoutMsg}
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-amber-800 text-white font-semibold rounded-full hover:bg-amber-900 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Afrekenen met iDEAL
              </button>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setCheckoutMsg(null);
                }}
                className="w-full py-2.5 text-stone-600 text-sm font-medium hover:text-amber-800 transition-colors"
              >
                Verder winkelen
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
