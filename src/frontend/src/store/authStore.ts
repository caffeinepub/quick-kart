import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthAddress {
  flat: string;
  building: string;
  landmark: string;
  area: string;
  pincode: string;
  type: string;
}

export interface AuthUser {
  phone: string;
  name: string;
  address: AuthAddress | null;
  orderIds: number[];
}

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
  addOrderId: (id: number) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      addOrderId: (id) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, orderIds: [...state.user.orderIds, id] }
            : null,
        })),
    }),
    { name: "quickkart-auth" },
  ),
);
