import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import type { TableData } from "@/types/models";

export default function TableLanding() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    startOrder,
    resumeOrder,
    listenToTable,
    setTable: setStoreTable,
  } = useOrderStore();

  useEffect(() => {
    const init = async () => {
      try {
        const snapshot = await get(ref(db, `tables/${tableId}`));
        if (!snapshot.exists()) {
          setError("Table not found");
          setLoading(false);
          return;
        }

        const tableData = snapshot.val() as TableData;
        setTable(tableData);
        setStoreTable(tableId!, tableData.number, tableData.name);
        listenToTable(tableId!);

        if (tableData.activeOrderId) {
          resumeOrder(tableData.activeOrderId);
          navigate(`/table/${tableId}/menu`);
          return;
        }

        const savedOrderId = localStorage.getItem("activeOrderId");
        const savedTableId = localStorage.getItem("activeTableId");
        if (savedOrderId && savedTableId === tableId) {
          const orderSnap = await get(ref(db, `orders/${savedOrderId}`));
          if (orderSnap.exists() && orderSnap.val().status !== "completed") {
            resumeOrder(savedOrderId);
            navigate(`/table/${tableId}/menu`);
            return;
          } else {
            localStorage.removeItem("activeOrderId");
            localStorage.removeItem("activeTableId");
          }
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load table");
        setLoading(false);
      }
    };

    init();
  }, [tableId]);

  const handleStartOrder = async () => {
    if (!table) return;
    setLoading(true);
    try {
      await startOrder(tableId!, table.number);
      navigate(`/table/${tableId}/menu`);
    } catch (err) {
      setError("Failed to start order");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-red-500 text-lg">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Table {table!.number}
            </h1>
            {table!.name && <p className="text-zinc-500 mt-1">{table!.name}</p>}
          </div>
          <Button
            size="lg"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6"
            onClick={handleStartOrder}
          >
            Start Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
