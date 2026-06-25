import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Minus, ChevronRight, Loader2 } from "lucide-react";
import type { MenuItem, Category } from "@/types/models";

export default function Menu() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const {
    currentOrderId,
    items: orderItems,
    total,
    addItem,
    tableNumber,
  } = useOrderStore();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (!currentOrderId) {
      navigate(`/table/${tableId}`);
      return;
    }

    const menuRef = ref(db, "menu");
    const catRef = ref(db, "categories");

    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data)
          .map(([id, item]) => ({ id, ...(item as Omit<MenuItem, "id">) }))
          .filter((item) => item.available);
        setMenuItems(items);
      } else {
        setMenuItems([]);
      }
    });

    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const cats = Object.entries(data)
          .map(([id, cat]) => ({ id, ...(cat as Omit<Category, "id">) }))
          .sort((a, b) => a.order - b.order);
        setCategories(cats);
        if (cats.length > 0 && !activeCategory) {
          setActiveCategory(cats[0].id);
        }
      }
      setLoading(false);
    });

    return () => {
      off(menuRef);
      off(catRef);
    };
  }, [currentOrderId, tableId]);

  const handleAddItem = async () => {
    if (!selectedItem) return;
    setAdding(true);
    try {
      await addItem(selectedItem, quantity, notes);
      setSelectedItem(null);
      setQuantity(1);
      setNotes("");
    } catch (err) {
      console.error("Failed to add item:", err);
    }
    setAdding(false);
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter((item) => item.category === categoryId);
  };

  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-900">Menu</h1>
            <Badge variant="secondary" className="text-xs">
              Table {tableNumber}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/table/${tableId}/order`)}
          >
            View Order
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {categories.length > 0 ? (
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full"
        >
          <div className="sticky top-[57px] z-10 bg-zinc-50 border-b border-zinc-200">
            <ScrollArea className="w-full">
              <TabsList className="w-full justify-start px-4 py-2 h-auto bg-transparent gap-2 flex-nowrap">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="shrink-0 data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-full px-4 py-1.5 text-sm"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0 p-4">
              <div className="space-y-3">
                {getItemsByCategory(cat.id).length === 0 ? (
                  <p className="text-center text-zinc-400 py-8">
                    No items in this category
                  </p>
                ) : (
                  getItemsByCategory(cat.id).map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedItem(item);
                        setQuantity(1);
                        setNotes("");
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-zinc-900">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="font-bold text-orange-600">
                              ${item.price.toFixed(2)}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="p-4 text-center text-zinc-400">
          <p>No menu items available yet.</p>
        </div>
      )}

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open: boolean) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem?.description && (
            <p className="text-sm text-zinc-500">{selectedItem.description}</p>
          )}
          <p className="text-lg font-bold text-orange-600">
            ${selectedItem?.price.toFixed(2)}
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Quantity
              </label>
              <div className="flex items-center gap-3 mt-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Special Instructions
              </label>
              <textarea
                className="w-full mt-1 p-2 border border-zinc-200 rounded-md text-sm resize-none"
                rows={2}
                placeholder="Any allergies or preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleAddItem}
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add to Order — $
              {((selectedItem?.price || 0) * quantity).toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3 z-20">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-sm text-zinc-500">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
            <p className="text-lg font-bold text-zinc-900">
              ${total.toFixed(2)}
            </p>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white px-6"
            onClick={() => navigate(`/table/${tableId}/order`)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Order
          </Button>
        </div>
      </div>
    </div>
  );
}
