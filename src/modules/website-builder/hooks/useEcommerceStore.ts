/**
 * Global cart & wishlist state manager for the website builder.
 *
 * Persists in localStorage and syncs across components / pages via CustomEvents.
 * Pattern mirrors useCompanyLogo: localStorage + event bus.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CartItem {
  /** Stable product identifier (name-based fallback when no real id) */
  productId: string;
  name: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  variant?: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  inStock?: boolean;
}

interface EcommerceState {
  cart: CartItem[];
  wishlist: WishlistItem[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'wb-ecommerce-store';
const CART_EVENT = 'wb-cart-updated';
const WISHLIST_EVENT = 'wb-wishlist-updated';

/* ------------------------------------------------------------------ */
/*  Persistence helpers                                                */
/* ------------------------------------------------------------------ */

function loadState(): EcommerceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return { cart: [], wishlist: [] };
}

function persistState(state: EcommerceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ------------------------------------------------------------------ */
/*  Derived helpers                                                    */
/* ------------------------------------------------------------------ */

/** Parse a price string like "$12.99" → number 12.99 */
function parsePrice(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useEcommerceStore() {
  const [state, setState] = useState<EcommerceState>(loadState);

  // Sync from other tabs / components
  useEffect(() => {
    const onCartUpdate = () => setState(loadState());
    const onWishlistUpdate = () => setState(loadState());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(loadState());
    };

    window.addEventListener(CART_EVENT, onCartUpdate);
    window.addEventListener(WISHLIST_EVENT, onWishlistUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CART_EVENT, onCartUpdate);
      window.removeEventListener(WISHLIST_EVENT, onWishlistUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ── Cart actions ──────────────────────────────

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setState(prev => {
      const qty = item.quantity ?? 1;
      const existing = prev.cart.find(
        c => c.productId === item.productId && c.variant === item.variant
      );
      const newCart = existing
        ? prev.cart.map(c =>
            c.productId === item.productId && c.variant === item.variant
              ? { ...c, quantity: c.quantity + qty }
              : c
          )
        : [...prev.cart, { ...item, quantity: qty }];
      const next = { ...prev, cart: newCart };
      persistState(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variant?: string) => {
    setState(prev => {
      const newCart = prev.cart.filter(
        c => !(c.productId === productId && c.variant === variant)
      );
      const next = { ...prev, cart: newCart };
      persistState(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number, variant?: string) => {
    setState(prev => {
      const newCart = quantity <= 0
        ? prev.cart.filter(c => !(c.productId === productId && c.variant === variant))
        : prev.cart.map(c =>
            c.productId === productId && c.variant === variant
              ? { ...c, quantity }
              : c
          );
      const next = { ...prev, cart: newCart };
      persistState(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setState(prev => {
      const next = { ...prev, cart: [] };
      persistState(next);
      window.dispatchEvent(new Event(CART_EVENT));
      return next;
    });
  }, []);

  const isInCart = useCallback((productId: string) => {
    return state.cart.some(c => c.productId === productId);
  }, [state.cart]);

  // ── Wishlist actions ──────────────────────────

  const addToWishlist = useCallback((item: WishlistItem) => {
    setState(prev => {
      if (prev.wishlist.some(w => w.productId === item.productId)) return prev;
      const next = { ...prev, wishlist: [...prev.wishlist, item] };
      persistState(next);
      window.dispatchEvent(new Event(WISHLIST_EVENT));
      return next;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setState(prev => {
      const next = { ...prev, wishlist: prev.wishlist.filter(w => w.productId !== productId) };
      persistState(next);
      window.dispatchEvent(new Event(WISHLIST_EVENT));
      return next;
    });
  }, []);

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setState(prev => {
      const exists = prev.wishlist.some(w => w.productId === item.productId);
      const newWishlist = exists
        ? prev.wishlist.filter(w => w.productId !== item.productId)
        : [...prev.wishlist, item];
      const next = { ...prev, wishlist: newWishlist };
      persistState(next);
      window.dispatchEvent(new Event(WISHLIST_EVENT));
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return state.wishlist.some(w => w.productId === productId);
  }, [state.wishlist]);

  const moveWishlistToCart = useCallback((productId: string) => {
    const item = state.wishlist.find(w => w.productId === productId);
    if (!item || item.inStock === false) return;
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      oldPrice: item.oldPrice,
      imageUrl: item.imageUrl,
    });
    removeFromWishlist(productId);
  }, [state.wishlist, addToCart, removeFromWishlist]);

  const clearWishlist = useCallback(() => {
    setState(prev => {
      const next = { ...prev, wishlist: [] };
      persistState(next);
      window.dispatchEvent(new Event(WISHLIST_EVENT));
      return next;
    });
  }, []);

  // ── Derived values ────────────────────────────

  const cartCount = useMemo(
    () => state.cart.reduce((sum, c) => sum + c.quantity, 0),
    [state.cart]
  );

  const cartTotal = useMemo(
    () => state.cart.reduce((sum, c) => sum + parsePrice(c.price) * c.quantity, 0),
    [state.cart]
  );

  const wishlistCount = state.wishlist.length;

  return {
    // State
    cart: state.cart,
    wishlist: state.wishlist,
    cartCount,
    cartTotal,
    wishlistCount,

    // Cart actions
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isInCart,

    // Wishlist actions
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    moveWishlistToCart,
    clearWishlist,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: generate a stable productId from a product object          */
/* ------------------------------------------------------------------ */

export function toProductId(product: { name: string; price?: string }): string {
  return `${product.name}__${product.price || ''}`.replace(/\s+/g, '_').toLowerCase();
}
