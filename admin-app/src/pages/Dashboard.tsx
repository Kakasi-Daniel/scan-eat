import { useOrderStore } from "@/stores/orderStore";
import { useTableStore } from "@/stores/tableStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function Dashboard() {
  const { activeOrders, completedOrders } = useOrderStore();
  const { tables } = useTableStore();

  const paymentRequested = activeOrders.filter(
    (o) => o.status === "payment_requested",
  );
  const occupiedTables = tables.filter((t) => t.status !== "available");
  const recentCompleted = completedOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Active Orders</p>
                <p className="text-3xl font-bold text-zinc-900">
                  {activeOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Payment Requests</p>
                <p className="text-3xl font-bold text-amber-600">
                  {paymentRequested.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Occupied Tables</p>
                <p className="text-3xl font-bold text-zinc-900">
                  {occupiedTables.length}/{tables.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {completedOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {paymentRequested.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Tables Requesting Payment
            </h2>
            <div className="mt-3 space-y-2">
              {paymentRequested.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
                >
                  <div>
                    <span className="font-medium">
                      Table {order.tableNumber}
                    </span>
                    <span className="text-sm text-zinc-500 ml-3">
                      {order.items.length} items · ${order.total.toFixed(2)}
                    </span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    {order.paymentMethod === "cash" ? "Cash" : "Card"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Recent Completed Orders
          </h2>
          {recentCompleted.length === 0 ? (
            <p className="text-zinc-400 text-sm">No completed orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentCompleted.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div>
                      <span className="text-sm font-medium">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs text-zinc-400 ml-2">
                        {order.completedAt
                          ? new Date(order.completedAt).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
