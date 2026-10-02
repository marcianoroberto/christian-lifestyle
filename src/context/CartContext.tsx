import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product, ProductVariant } from '@/lib/supabase';

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'christian-webshop-cart-v2';

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return Boolean(
    item.product &&
    item.variant &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.variant.id === 'string' &&
    typeof item.variant.price === 'number'
  );
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage can be unavailable in privacy-restricted browsers.
    }
  }, [items]);

  const addToCart = (product: Product, variant: ProductVariant, quantity = 1) => {
    if (!variant.is_active || !variant.is_available || quantity <= 0) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id
            ? { ...item, product, variant, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, variant, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.variant.price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
