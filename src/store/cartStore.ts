import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  cart_item_id: string; // Unique ID for cart entry
  itemType: 'merch' | 'ticket';

  // Specific to Merch
  product_id?: string;
  variant_id?: string | null;
  product_name?: string;
  variant_name?: string | null;

  // Specific to Tickets
  event_id?: string;
  ticket_tier_id?: string;
  event_name?: string;
  ticket_tier_name?: string;

  // Common Fields
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
  hasMerch: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (newItem) => {
        set((state) => {
          let existingItemIndex = -1;

          if (newItem.itemType === 'merch') {
            existingItemIndex = state.items.findIndex(
              (item) => item.itemType === 'merch' && item.product_id === newItem.product_id && item.variant_id === newItem.variant_id
            );
          } else if (newItem.itemType === 'ticket') {
            existingItemIndex = state.items.findIndex(
              (item) => item.itemType === 'ticket' && item.event_id === newItem.event_id && item.ticket_tier_id === newItem.ticket_tier_id
            );
          }

          if (existingItemIndex !== -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems, isDrawerOpen: true };
          } else {
            const idPart = newItem.itemType === 'merch' ? `${newItem.product_id}-${newItem.variant_id || 'base'}` : `${newItem.event_id}-${newItem.ticket_tier_id}`;
            const cart_item_id = `${newItem.itemType}-${idPart}-${Date.now()}`;
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
      },

      hasMerch: () => {
        return get().items.some(item => item.itemType === 'merch');
      }
    }),
    {
      name: 'bassfactory-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
