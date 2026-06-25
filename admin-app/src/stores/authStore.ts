import { create } from "zustand";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: () => {
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  },

  login: async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    set({ user: result.user });
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));
