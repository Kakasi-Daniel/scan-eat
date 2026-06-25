import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type {
  Order,
  OrderItem,
  OrderItemStatus,
  StatusConfig,
} from "@/types/models";

const statusConfig: Record<OrderItemStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "bg-zinc-100 text-zinc-600",
    next: "received",
  },
  received: {
    label: "Received",
    color: "bg-blue-100 text-blue-700",
    next: "preparing",
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-100 text-orange-700",
    next: "served",
  },
  served: {
    label: "Served",
    color: "bg-green-100 text-green-700",
    next: null,
  },
};

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { updateItemStatus, confirmPayment } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orderRef = ref(db, `orders/${orderId}`);
    onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
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
        setOrder({ id: orderId!, ...data, items, total });
      }
    });

    return () => off(orderRef);
  }, [orderId]);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const handleStatusChange = async (
    itemId: string,
    currentStatus: OrderItemStatus,
  ) => {
    const nextStatus = statusConfig[currentStatus]?.next;
    if (!nextStatus) return;
    await updateItemStatus(orderId!, itemId, nextStatus);
  };

  const handleConfirmPayment = async () => {
    if (!confirm(`Confirm payment for Table ${order.tableNumber}?`)) return;
    await confirmPayment(orderId!, order.tableId);
    navigate("/orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Order — Table {order.tableNumber}
          </h1>
          <p className="text-sm text-zinc-500">
            Created {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            className={`text-sm ${
              order.status === "completed"
                ? "bg-green-100 text-green-700"
                : order.status === "payment_requested"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
            } border-0`}
          >
            {order.status === "payment_requested"
              ? "Payment Requested"
              : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Items</h2>
          <div className="space-y-4">
            {order.items
              .sort((a, b) => a.addedAt - b.addedAt)
              .map((item) => {
                const status =
                  statusConfig[item.status] || statusConfig.pending;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-zinc-400">x{item.quantity}</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-zinc-400 italic mt-0.5">
                          "{item.notes}"
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Added {new Date(item.addedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${status.color} border-0`}
                        onClick={() => handleStatusChange(item.id, item.status)}
                        disabled={!status.next}
                      >
                        {status.label}
                        {status.next && " →"}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>

          {order.paymentMethod && (
            <p className="text-sm text-zinc-500 mt-2">
              Payment method: {order.paymentMethod === "cash" ? "Cash" : "Card"}
            </p>
          )}
        </CardContent>
      </Card>

      {order.status === "payment_requested" && (
        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleConfirmPayment}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Confirm Payment — ${order.total.toFixed(2)}
        </Button>
      )}
    </div>
  );
}
