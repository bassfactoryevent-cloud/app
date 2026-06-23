import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  cart_item_id: string; // Unique ID for cart entry
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  addItem: (item: Omit<CartItem, 'cart_item_id'>) => void;
  removeItem: (cart_item_id: string) => void;
  updateQuantity: (cart_item_id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (newItem) => {
        set((state) => {
          // Check if same product + variant exists
          const existingItemIndex = state.items.findIndex(
            (item) => item.product_id === newItem.product_id && item.variant_id === newItem.variant_id
          );

          if (existingItemIndex !== -1) {
            // Increase quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems, isDrawerOpen: true };
          } else {
            // Add new item
            const cart_item_id = `${newItem.product_id}-${newItem.variant_id || 'base'}-${Date.now()}`;
            return { items: [...state.items, { ...newItem, cart_item_id }], isDrawerOpen: true };
          }
        });
      },

      removeItem: (cart_item_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.cart_item_id !== cart_item_id)
        }));
      },

      updateQuantity: (cart_item_id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.cart_item_id === cart_item_id ? { ...item, quantity: Math.max(1, quantity) } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),
      
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
      }
    }),
    {
      name: 'bassfactory-cart', // local storage key
      partialize: (state) => ({ items: state.items }), // Solo persistir los items, no si el drawer está abierto
    }
  )
);
