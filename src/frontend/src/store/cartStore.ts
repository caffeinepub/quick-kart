import { create } from "zustand";
import type { Product } from "../data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  wishlist: number[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem("quickkart-cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadWishlistFromStorage = () => {
  try {
    const stored = localStorage.getItem("quickkart-wishlist");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadFromStorage(),
  wishlist: loadWishlistFromStorage(),

  addToCart: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      let newItems: CartItem[];
      if (existing) {
        newItems = state.items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        newItems = [...state.items, { product, quantity: 1 }];
      }
      localStorage.setItem("quickkart-cart", JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.product.id !== productId);
      localStorage.setItem("quickkart-cart", JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      let newItems: CartItem[];
      if (quantity <= 0) {
        newItems = state.items.filter((i) => i.product.id !== productId);
      } else {
        newItems = state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i,
        );
      }
      localStorage.setItem("quickkart-cart", JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  clearCart: () => {
    localStorage.removeItem("quickkart-cart");
    set({ items: [] });
  },

  toggleWishlist: (productId) => {
    set((state) => {
      const newWishlist = state.wishlist.includes(productId)
        ? state.wishlist.filter((id) => id !== productId)
        : [...state.wishlist, productId];
      localStorage.setItem("quickkart-wishlist", JSON.stringify(newWishlist));
      return { wishlist: newWishlist };
    });
  },

  isInWishlist: (productId) => get().wishlist.includes(productId),

  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
}));
