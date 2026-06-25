export type TableStatus = "available" | "occupied" | "payment_requested";

export type OrderStatus = "active" | "payment_requested" | "completed";

export type OrderItemStatus = "pending" | "received" | "preparing" | "served";

export type PaymentMethod = "cash" | "card";

export interface Table {
  id: string;
  name: string;
  number: number;
  status: TableStatus;
  activeOrderId: string | null;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  title: string;
  price: number;
  quantity: number;
  status: OrderItemStatus;
  addedAt: number;
  notes: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: number;
  completedAt: number | null;
  total: number;
  items: OrderItem[];
}

// Firebase DB shapes (without the `id` field, as stored in Firebase)
export type TableData = Omit<Table, "id">;
export type CategoryData = Omit<Category, "id">;
export type MenuItemData = Omit<MenuItem, "id">;
export type OrderItemData = Omit<OrderItem, "id">;

export interface OrderData {
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: number;
  completedAt: number | null;
  total: number;
  items?: Record<string, OrderItemData>;
}

export interface StatusConfig {
  label: string;
  color: string;
  next: OrderItemStatus | null;
}
