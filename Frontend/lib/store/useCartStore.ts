import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Medicine {
  id: number;
  name: string;
  brand: string;
  price: number;
  type: string;
  rx: boolean;
  color: string;
  image_url?: string;
  packaging_type?: string;
  salt_composition?: string;
  stock?: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  medicine?: Medicine;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (id: number, medicine?: Medicine) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setCart: (cart: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (id: number, medicine?: Medicine) => {
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.id === id);
        if (existing) {
          set({
            cart: currentCart.map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity + 1, medicine: medicine || item.medicine }
                : item
            ),
          });
        } else {
          set({
            cart: [...currentCart, { id, quantity: 1, medicine }],
          });
        }
      },
      removeFromCart: (id: number) => {
        set({
          cart: get().cart.filter((item) => item.id !== id),
        });
      },
      updateCartQuantity: (id: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
        } else {
          set({
            cart: get().cart.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          });
        }
      },
      clearCart: () => {
        set({ cart: [] });
      },
      setCart: (cart: CartItem[]) => {
        set({ cart });
      },
    }),
    {
      name: "medimall_cart_store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
