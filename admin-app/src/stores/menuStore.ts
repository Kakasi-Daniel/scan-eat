import { create } from "zustand";
import { db } from "@/lib/firebase";
import {
  ref,
  onValue,
  off,
  set as fbSet,
  push,
  remove,
  update,
} from "firebase/database";
import type {
  MenuItem,
  Category,
  MenuItemData,
  CategoryData,
} from "@/types/models";

interface MenuState {
  items: MenuItem[];
  categories: Category[];
  _itemsUnsub: (() => void) | null;
  _catsUnsub: (() => void) | null;
  listen: () => void;
  addItem: (item: Omit<MenuItemData, "createdAt">) => Promise<void>;
  updateItem: (id: string, data: Partial<MenuItemData>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, data: Partial<CategoryData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categories: [],
  _itemsUnsub: null,
  _catsUnsub: null,

  listen: () => {
    const state = get();
    if (state._itemsUnsub) return;

    const menuRef = ref(db, "menu");
    const catRef = ref(db, "categories");

    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([id, item]) => ({
          id,
          ...(item as Omit<MenuItem, "id">),
        }));
        set({ items });
      } else {
        set({ items: [] });
      }
    });

    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categories = Object.entries(data)
          .map(([id, cat]) => ({ id, ...(cat as Omit<Category, "id">) }))
          .sort((a, b) => a.order - b.order);
        set({ categories });
      } else {
        set({ categories: [] });
      }
    });

    set({
      _itemsUnsub: () => off(menuRef),
      _catsUnsub: () => off(catRef),
    });
  },

  addItem: async (item) => {
    const newRef = push(ref(db, "menu"));
    await fbSet(newRef, {
      ...item,
      createdAt: Date.now(),
    });
  },

  updateItem: async (id, data) => {
    await update(ref(db, `menu/${id}`), data);
  },

  deleteItem: async (id) => {
    await remove(ref(db, `menu/${id}`));
  },

  addCategory: async (name) => {
    const { categories } = get();
    const maxOrder = categories.reduce(
      (max, c) => Math.max(max, c.order || 0),
      0,
    );
    const newRef = push(ref(db, "categories"));
    await fbSet(newRef, { name, order: maxOrder + 1 });
  },

  updateCategory: async (id, data) => {
    await update(ref(db, `categories/${id}`), data);
  },

  deleteCategory: async (id) => {
    await remove(ref(db, `categories/${id}`));
  },
}));
