import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch("http://localhost:5001/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.ok) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: data.message };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: "Network error" };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            "http://localhost:5001/api/auth/register",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            }
          );

          const data = await response.json();

          if (response.ok) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: data.message };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: "Network error" };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const state = get();
        return state.isAuthenticated && state.token;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
