import { useState } from "react";
import { useTableStore } from "@/stores/tableStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, QrCode, Download, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Table, TableStatus } from "@/types/models";

const statusColors: Record<TableStatus, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-blue-100 text-blue-700",
  payment_requested: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<TableStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  payment_requested: "Payment Requested",
};

export default function TableManagement() {
  const { tables, addTable, deleteTable } = useTableStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableName, setTableName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [publicDomain, setPublicDomain] = useState(
    import.meta.env.VITE_PUBLIC_APP_URL || "http://localhost:5173",
  );

  const handleAddTable = async () => {
    if (!tableNumber) return;
    setSaving(true);
    try {
      await addTable(
        tableName || `Table ${tableNumber}`,
        parseInt(tableNumber),
      );
      setAddDialogOpen(false);
      setTableName("");
      setTableNumber("");
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status !== "available") {
      alert("Cannot delete a table that is currently in use.");
      return;
    }
    if (!confirm(`Delete Table ${table.number}?`)) return;
    await deleteTable(table.id);
  };

  const openQrDialog = (table: Table) => {
    setSelectedTable(table);
    setQrDialogOpen(true);
  };

  const downloadQr = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement("a");
      link.download = `table-${selectedTable!.number}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Table Management</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Public App URL</Label>
            <Input
              value={publicDomain}
              onChange={(e) => setPublicDomain(e.target.value)}
              placeholder="https://your-public-app.web.app"
              className="max-w-md"
            />
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              Used for QR codes
            </span>
          </div>
        </CardContent>
      </Card>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-zinc-400">
              No tables yet. Add one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables
            .sort((a, b) => a.number - b.number)
            .map((table) => (
              <Card key={table.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">
                        Table {table.number}
                      </h3>
                      {table.name && table.name !== `Table ${table.number}` && (
                        <p className="text-sm text-zinc-500">{table.name}</p>
                      )}
                    </div>
                    <Badge
                      className={`${statusColors[table.status]} border-0 text-xs`}
                    >
                      {statusLabels[table.status]}
                    </Badge>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openQrDialog(table)}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTable(table)}
                      disabled={table.status !== "available"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Window Seat"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleAddTable}
              disabled={saving || !tableNumber}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code — Table {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <QRCodeSVG
                id="qr-code-svg"
                value={`${publicDomain}/table/${selectedTable.id}`}
                size={256}
                level="H"
                includeMargin
              />
              <p className="text-xs text-zinc-400 text-center break-all">
                {publicDomain}/table/{selectedTable.id}
              </p>
              <Button onClick={downloadQr}>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
