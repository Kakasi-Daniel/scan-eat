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
import type { Table, TableData } from "@/types/models";

interface TableState {
  tables: Table[];
  _unsub: (() => void) | null;
  listen: () => void;
  addTable: (name: string, number: number) => Promise<string | null>;
  deleteTable: (id: string) => Promise<void>;
  updateTable: (id: string, data: Partial<TableData>) => Promise<void>;
}

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  _unsub: null,

  listen: () => {
    const state = get();
    if (state._unsub) return;

    const tablesRef = ref(db, "tables");
    onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tables = Object.entries(data).map(([id, table]) => ({
          id,
          ...(table as Omit<Table, "id">),
        }));
        set({ tables });
      } else {
        set({ tables: [] });
      }
    });

    set({ _unsub: () => off(tablesRef) });
  },

  addTable: async (name, number) => {
    const newRef = push(ref(db, "tables"));
    await fbSet(newRef, {
      name,
      number,
      status: "available",
      activeOrderId: null,
    });
    return newRef.key;
  },

  deleteTable: async (id) => {
    await remove(ref(db, `tables/${id}`));
  },

  updateTable: async (id, data) => {
    await update(ref(db, `tables/${id}`), data);
  },
}));
