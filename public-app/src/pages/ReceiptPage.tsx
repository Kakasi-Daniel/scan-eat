import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, Printer, ArrowLeft } from "lucide-react";
import type { Order, OrderItem } from "@/types/models";

export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const snapshot = await get(ref(db, `orders/${orderId}`));
        if (!snapshot.exists()) {
          setError("Receipt not found");
          setLoading(false);
          return;
        }
        const data = snapshot.val();
        const items: OrderItem[] = data.items
          ? Object.entries(data.items).map(([id, item]) => ({
              id,
              ...(item as Omit<OrderItem, "id">),
            }))
          : [];
        setOrder({ id: orderId!, ...data, items, total: 0 });
        setLoading(false);
      } catch (err) {
        setError("Failed to load receipt");
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-red-500">{error}</p>
            <Link
              to="/"
              className="text-orange-600 underline text-sm mt-4 block"
            >
              Go Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-4 flex items-start justify-center pt-8">
      <Card className="max-w-md w-full" id="receipt">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Receipt className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900">Order Receipt</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Table {order.tableNumber}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            {order.items
              .sort((a, b) => a.addedAt - b.addedAt)
              .map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-zinc-900">{item.title}</span>
                    <span className="text-zinc-400 ml-2">x{item.quantity}</span>
                    {item.notes && (
                      <p className="text-xs text-zinc-400 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                  <span className="text-zinc-900 font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-zinc-900">Total</span>
            <span className="text-lg font-bold text-orange-600">
              ${total.toFixed(2)}
            </span>
          </div>

          {order.paymentMethod && (
            <div className="text-center text-sm text-zinc-500">
              Paid by {order.paymentMethod === "cash" ? "Cash" : "Card"}
            </div>
          )}

          {order.completedAt && (
            <div className="text-center text-xs text-zinc-400">
              Completed: {new Date(order.completedAt).toLocaleString()}
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-zinc-400">
            Thank you for dining with us!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
