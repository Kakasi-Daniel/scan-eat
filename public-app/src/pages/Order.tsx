import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Clock,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type {
  OrderItemStatus,
  StatusConfig,
  PaymentMethod,
} from "@/types/models";

const statusConfig: Record<OrderItemStatus, Omit<StatusConfig, "next">> = {
  pending: { label: "Pending", color: "bg-zinc-100 text-zinc-600" },
  received: { label: "Received", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700" },
  served: { label: "Served", color: "bg-green-100 text-green-700" },
};

export default function Order() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const {
    currentOrderId,
    items,
    total,
    orderStatus,
    paymentMethod,
    tableNumber,
    requestPayment,
  } = useOrderStore();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentOrderId) {
      navigate(`/table/${tableId}`);
    }
  }, [currentOrderId, tableId]);

  useEffect(() => {
    const newStatuses: Record<string, string> = {};
    items.forEach((item) => {
      newStatuses[item.id] = item.status;
      if (prevStatuses[item.id] && prevStatuses[item.id] !== item.status) {
        const el = document.getElementById(`item-${item.id}`);
        if (el) {
          el.classList.add("animate-pulse");
          setTimeout(() => el.classList.remove("animate-pulse"), 2000);
        }
      }
    });
    setPrevStatuses(newStatuses);
  }, [items]);

  const handlePayment = async (method: PaymentMethod) => {
    setPaying(true);
    try {
      await requestPayment(method);
      setPayDialogOpen(false);
    } catch (err) {
      console.error("Payment request failed:", err);
    }
    setPaying(false);
  };

  if (!currentOrderId) return null;

  const isPaymentRequested = orderStatus === "payment_requested";
  const isCompleted = orderStatus === "completed";

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(`/table/${tableId}/menu`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">Your Order</h1>
              <p className="text-xs text-zinc-500">Table {tableNumber}</p>
            </div>
          </div>
          {orderStatus === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/table/${tableId}/menu`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add More
            </Button>
          )}
        </div>
      </div>

      {isPaymentRequested && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-700">
            <Clock className="w-4 h-4" />
            <p className="text-sm font-medium">
              Payment requested — waiting for staff confirmation
            </p>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Payment method: {paymentMethod === "cash" ? "Cash" : "Card"}
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm font-medium">Payment confirmed! Thank you!</p>
          </div>
          <Link
            to={`/receipt/${currentOrderId}`}
            className="inline-flex items-center gap-1 text-sm text-green-600 underline mt-2"
          >
            <Receipt className="w-3 h-3" />
            View Receipt
          </Link>
        </div>
      )}

      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">No items yet</p>
            <Button
              variant="link"
              className="text-orange-600 mt-2"
              onClick={() => navigate(`/table/${tableId}/menu`)}
            >
              Browse the menu
            </Button>
          </div>
        ) : (
          items
            .sort((a, b) => a.addedAt - b.addedAt)
            .map((item) => {
              const status = statusConfig[item.status] || statusConfig.pending;
              return (
                <Card
                  key={item.id}
                  id={`item-${item.id}`}
                  className="transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-900">
                            {item.title}
                          </h3>
                          <Badge className={`text-xs ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-zinc-400 mt-1 italic">
                            "{item.notes}"
                          </p>
                        )}
                        <p className="text-sm text-zinc-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-zinc-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3 z-20">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500">Total</span>
              <span className="text-xl font-bold text-zinc-900">
                ${total.toFixed(2)}
              </span>
            </div>
            {orderStatus === "active" && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 text-base"
                onClick={() => setPayDialogOpen(true)}
              >
                Request Payment
              </Button>
            )}
            {isCompleted && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-5 text-base"
                onClick={() => navigate(`/receipt/${currentOrderId}`)}
              >
                <Receipt className="w-4 h-4 mr-2" />
                View Receipt
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>How would you like to pay?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:border-orange-600 hover:text-orange-600"
              onClick={() => handlePayment("cash")}
              disabled={paying}
            >
              <Banknote className="w-8 h-8" />
              <span>Cash</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:border-orange-600 hover:text-orange-600"
              onClick={() => handlePayment("card")}
              disabled={paying}
            >
              <CreditCard className="w-8 h-8" />
              <span>Card</span>
            </Button>
          </div>
          {paying && (
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
