"use client";

import { create } from "zustand";

export interface CartLine {
  productId: string;
  size: string;
  colour: string;
  qty: number;
}

interface ShopState {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (line: Omit<CartLine, "qty">) => void;
  toggleWish: (productId: string) => void;
}

export const useShopStore = create<ShopState>((set) => ({
  cart: [],
  wishlist: [],
  addToCart: (line) =>
    set((s) => {
      const i = s.cart.findIndex(
        (c) => c.productId === line.productId && c.size === line.size && c.colour === line.colour,
      );
      if (i >= 0) {
        const cart = s.cart.slice();
        cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
        return { cart };
      }
      return { cart: [...s.cart, { ...line, qty: 1 }] };
    }),
  toggleWish: (id) =>
    set((s) => ({
      wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id],
    })),
}));

export const cartCount = (s: ShopState) => s.cart.reduce((n, c) => n + c.qty, 0);
