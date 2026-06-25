import { create } from "zustand";
import { db } from "@/lib/firebase";
import { ref, onValue, off, update } from "firebase/database";
import type { Order, OrderItem, OrderItemStatus } from "@/types/models";

interface OrderState {
  activeOrders: Order[];
  completedOrders: Order[];
  _unsub: (() => void) | null;
  prevOrderIds: Set<string>;
  prevPaymentRequested: Set<string>;
  onNewOrder: (() => void) | null;
  onPaymentRequested: (() => void) | null;
  setCallbacks: (
    onNewOrder: () => void,
    onPaymentRequested: () => void,
  ) => void;
  listen: () => void;
  updateItemStatus: (
    orderId: string,
    itemId: string,
    newStatus: OrderItemStatus,
  ) => Promise<void>;
  confirmPayment: (orderId: string, tableId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrders: [],
  completedOrders: [],
  _unsub: null,
  prevOrderIds: new Set(),
  prevPaymentRequested: new Set(),
  onNewOrder: null,
  onPaymentRequested: null,

  setCallbacks: (onNewOrder, onPaymentRequested) => {
    set({ onNewOrder, onPaymentRequested });
  },

  listen: () => {
    const state = get();
    if (state._unsub) return;

    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set({ activeOrders: [], completedOrders: [] });
        return;
      }

      const allOrders: Order[] = Object.entries(data).map(([id, order]) => {
        const raw = order as Record<string, unknown>;
        const itemsObj = raw.items as
          | Record<string, Omit<OrderItem, "id">>
          | undefined;
        const items: OrderItem[] = itemsObj
          ? Object.entries(itemsObj).map(([itemId, item]) => ({
              id: itemId,
              ...item,
            }))
          : [];
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        return {
          id,
          tableId: raw.tableId as string,
          tableNumber: raw.tableNumber as number,
          status: raw.status as Order["status"],
          paymentMethod: raw.paymentMethod as Order["paymentMethod"],
          createdAt: raw.createdAt as number,
          completedAt: (raw.completedAt as number) || null,
          items,
          total,
        };
      });

      const active = allOrders
        .filter(
          (o) => o.status === "active" || o.status === "payment_requested",
        )
        .sort((a, b) => b.createdAt - a.createdAt);

      const completed = allOrders
        .filter((o) => o.status === "completed")
        .sort(
          (a, b) =>
            (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt),
        )
        .slice(0, 50);

      const {
        prevOrderIds: prevOrderIds,
        prevPaymentRequested: prevPaymentRequested,
        onNewOrder,
        onPaymentRequested,
      } = get();
      const currentIds = new Set(active.map((o) => o.id));
      const currentPayReq = new Set(
        active.filter((o) => o.status === "payment_requested").map((o) => o.id),
      );

      if (prevOrderIds.size > 0) {
        for (const id of currentIds) {
          if (!prevOrderIds.has(id) && onNewOrder) {
            onNewOrder();
            break;
          }
        }
      }

      for (const id of currentPayReq) {
        if (!prevPaymentRequested.has(id) && onPaymentRequested) {
          onPaymentRequested();
          break;
        }
      }

      set({
        activeOrders: active,
        completedOrders: completed,
        prevOrderIds: currentIds,
        prevPaymentRequested: currentPayReq,
      });
    });

    set({ _unsub: () => off(ordersRef) });
  },

  updateItemStatus: async (orderId, itemId, newStatus) => {
    await update(ref(db, `orders/${orderId}/items/${itemId}`), {
      status: newStatus,
    });
  },

  confirmPayment: async (orderId, tableId) => {
    await update(ref(db, `orders/${orderId}`), {
      status: "completed",
      completedAt: Date.now(),
    });
    await update(ref(db, `tables/${tableId}`), {
      status: "available",
      activeOrderId: null,
    });
  },
}));
