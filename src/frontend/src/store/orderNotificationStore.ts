import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrderNotificationStore {
  lastSeenOrderCount: number;
  currentOrderCount: number;
  setCurrentOrderCount: (count: number) => void;
  markOrdersSeen: () => void;
  getNewOrderCount: () => number;
}

export const useOrderNotificationStore = create<OrderNotificationStore>()(
  persist(
    (set, get) => ({
      lastSeenOrderCount: 0,
      currentOrderCount: 0,
      setCurrentOrderCount: (count) => set({ currentOrderCount: count }),
      markOrdersSeen: () =>
        set((state) => ({ lastSeenOrderCount: state.currentOrderCount })),
      getNewOrderCount: () => {
        const { currentOrderCount, lastSeenOrderCount } = get();
        return Math.max(0, currentOrderCount - lastSeenOrderCount);
      },
    }),
    { name: "quickkart-order-notifications" },
  ),
);
