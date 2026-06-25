import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import type { Order, OrderItemStatus, StatusConfig } from "@/types/models";

function playBeep(frequency = 800, duration = 200) {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.value = 0.3;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000,
    );
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Audio not available
  }
}

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

function timeSince(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

export default function OrderManagement() {
  const navigate = useNavigate();
  const {
    activeOrders,
    completedOrders,
    updateItemStatus,
    confirmPayment,
    setCallbacks,
  } = useOrderStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setCallbacks(
        () => playBeep(800, 200),
        () => {
          playBeep(1200, 150);
          setTimeout(() => playBeep(1200, 150), 200);
        },
      );
      initialized.current = true;
    }
  }, []);

  const handleStatusChange = async (
    orderId: string,
    itemId: string,
    currentStatus: OrderItemStatus,
  ) => {
    const nextStatus = statusConfig[currentStatus]?.next;
    if (!nextStatus) return;
    await updateItemStatus(orderId, itemId, nextStatus);
  };

  const handleConfirmPayment = async (order: Order) => {
    if (
      !confirm(
        `Confirm payment for Table ${order.tableNumber}? ($${order.total.toFixed(2)} by ${order.paymentMethod})`,
      )
    )
      return;
    await confirmPayment(order.id, order.tableId);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const isPaymentRequested = order.status === "payment_requested";

    return (
      <Card
        className={`transition-all ${
          isPaymentRequested ? "border-amber-300 bg-amber-50 animate-pulse" : ""
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold">Table {order.tableNumber}</h3>
              {isPaymentRequested && (
                <Badge className="bg-amber-200 text-amber-800 border-0 animate-bounce">
                  {order.paymentMethod === "cash" ? (
                    <>
                      <Banknote className="w-3 h-3 mr-1" /> Cash
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3 h-3 mr-1" /> Card
                    </>
                  )}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSince(order.createdAt)}
              </p>
            </div>
          </div>

          <Separator className="mb-3" />

          <div className="space-y-2">
            {order.items
              .sort((a, b) => a.addedAt - b.addedAt)
              .map((item) => {
                const status =
                  statusConfig[item.status] || statusConfig.pending;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-zinc-400 ml-2">
                        x{item.quantity}
                      </span>
                      {item.notes && (
                        <p className="text-xs text-zinc-400 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs ${status.color} hover:opacity-80`}
                      onClick={() =>
                        handleStatusChange(order.id, item.id, item.status)
                      }
                      disabled={!status.next}
                    >
                      {status.label}
                      {status.next && " →"}
                    </Button>
                  </div>
                );
              })}
          </div>

          {isPaymentRequested && (
            <>
              <Separator className="my-3" />
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleConfirmPayment(order)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Payment — ${order.total.toFixed(2)}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Order Management</h1>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-zinc-400">
                No active orders
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-zinc-400">
                No completed orders
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {completedOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-green-200 bg-green-50/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">Table {order.tableNumber}</h3>
                      <div className="text-right">
                        <p className="font-bold">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-zinc-400">
                          {order.completedAt
                            ? new Date(order.completedAt).toLocaleTimeString()
                            : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {order.items.length} items ·{" "}
                      {order.paymentMethod || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
