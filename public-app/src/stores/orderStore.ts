import { create } from "zustand";
import { db } from "@/lib/firebase";
import { ref, set as fbSet, update, onValue, off, get } from "firebase/database";
import type {
  MenuItem,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  TableStatus,
} from "@/types/models";

interface OrderState {
  currentOrderId: string | null;
  tableId: string | null;
  tableNumber: number | null;
  tableName: string | null;
  items: OrderItem[];
  total: number;
  orderStatus: OrderStatus | null;
  paymentMethod: PaymentMethod | null;
  tableStatus: TableStatus | null;
  _orderUnsub: (() => void) | null;
  _tableUnsub: (() => void) | null;
  setTable: (tableId: string, tableNumber: number, tableName: string) => void;
  listenToTable: (tableId: string) => void;
  startOrder: (tableId: string, tableNumber: number) => Promise<string>;
  resumeOrder: (orderId: string) => void;
  listenToOrder: (orderId: string) => void;
  addItem: (
    menuItem: MenuItem,
    quantity?: number,
    notes?: string,
  ) => Promise<void>;
  requestPayment: (method: PaymentMethod) => Promise<void>;
  cleanup: () => void;
}

export const useOrderStore = create<OrderState>((set, getState) => ({
  currentOrderId: null,
  tableId: null,
  tableNumber: null,
  tableName: null,
  items: [],
  total: 0,
  orderStatus: null,
  paymentMethod: null,
  tableStatus: null,
  _orderUnsub: null,
  _tableUnsub: null,

  setTable: (tableId, tableNumber, tableName) => {
    set({ tableId, tableNumber, tableName });
  },

  listenToTable: (tableId) => {
    const state = getState();
    if (state._tableUnsub) state._tableUnsub();

    const tableRef = ref(db, `tables/${tableId}`);
    onValue(tableRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        set({
          tableStatus: data.status,
          tableNumber: data.number,
          tableName: data.name,
        });
        if (data.activeOrderId && !getState().currentOrderId) {
          getState().resumeOrder(data.activeOrderId);
        }
      }
    });

    set({ _tableUnsub: () => off(tableRef) });
  },

  startOrder: async (tableId, tableNumber) => {
    const orderId = crypto.randomUUID();
    const now = Date.now();

    const orderData = {
      tableId,
      tableNumber,
      status: "active" as const,
      paymentMethod: null,
      createdAt: now,
      completedAt: null,
      total: 0,
    };

    await fbSet(ref(db, `orders/${orderId}`), orderData);
    await update(ref(db, `tables/${tableId}`), {
      status: "occupied",
      activeOrderId: orderId,
    });

    localStorage.setItem("activeOrderId", orderId);
    localStorage.setItem("activeTableId", tableId);

    set({ currentOrderId: orderId, orderStatus: "active" });
    getState().listenToOrder(orderId);

    return orderId;
  },

  resumeOrder: (orderId) => {
    set({ currentOrderId: orderId });
    localStorage.setItem("activeOrderId", orderId);
    getState().listenToOrder(orderId);
  },

  listenToOrder: (orderId) => {
    const state = getState();
    if (state._orderUnsub) state._orderUnsub();

    const orderRef = ref(db, `orders/${orderId}`);
    onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const items: OrderItem[] = data.items
        ? Object.entries(data.items).map(([id, item]) => ({
            id,
            ...(item as Omit<OrderItem, "id">),
          }))
        : [];

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      set({
        currentOrderId: orderId,
        orderStatus: data.status,
        paymentMethod: data.paymentMethod,
        items,
        total,
      });

      if (data.status === "completed") {
        localStorage.removeItem("activeOrderId");
        localStorage.removeItem("activeTableId");
      }
    });

    set({ _orderUnsub: () => off(orderRef) });
  },

  addItem: async (menuItem, quantity = 1, notes = "") => {
    const { currentOrderId } = getState();
    if (!currentOrderId) return;

    const itemId = crypto.randomUUID();
    const orderItemData = {
      menuItemId: menuItem.id,
      title: menuItem.title,
      price: menuItem.price,
      quantity,
      status: "pending" as const,
      addedAt: Date.now(),
      notes,
    };

    await fbSet(
      ref(db, `orders/${currentOrderId}/items/${itemId}`),
      orderItemData,
    );

    const { items } = getState();
    const newTotal = [...items, { ...orderItemData, id: itemId }].reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    await update(ref(db, `orders/${currentOrderId}`), { total: newTotal });
  },

  requestPayment: async (method) => {
    const { currentOrderId, tableId } = getState();
    if (!currentOrderId) return;

    await update(ref(db, `orders/${currentOrderId}`), {
      status: "payment_requested",
      paymentMethod: method,
    });
    await update(ref(db, `tables/${tableId}`), {
      status: "payment_requested",
    });
  },

  cleanup: () => {
    const state = getState();
    if (state._orderUnsub) state._orderUnsub();
    if (state._tableUnsub) state._tableUnsub();
    set({
      currentOrderId: null,
      tableId: null,
      tableNumber: null,
      tableName: null,
      items: [],
      total: 0,
      orderStatus: null,
      paymentMethod: null,
      tableStatus: null,
      _orderUnsub: null,
      _tableUnsub: null,
    });
  },
}));
