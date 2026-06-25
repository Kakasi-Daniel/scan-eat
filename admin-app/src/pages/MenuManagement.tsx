import { useState } from "react";
import { useMenuStore } from "@/stores/menuStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import type { MenuItem, Category } from "@/types/models";

export default function MenuManagement() {
  const {
    items,
    categories,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useMenuStore();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [available, setAvailable] = useState(true);

  const [catName, setCatName] = useState("");

  const openItemDialog = (item: MenuItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setDescription(item.description || "");
      setPrice(String(item.price));
      setCategory(item.category);
      setAvailable(item.available);
    } else {
      setEditingItem(null);
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory(categories[0]?.id || "");
      setAvailable(true);
    }
    setItemDialogOpen(true);
  };

  const openCatDialog = (cat: Category | null = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
    } else {
      setEditingCat(null);
      setCatName("");
    }
    setCatDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!title || !price || !category) return;
    setSaving(true);
    try {
      const data = {
        title,
        description,
        price: parseFloat(price),
        category,
        available,
      };
      if (editingItem) {
        await updateItem(editingItem.id, data);
      } else {
        await addItem(data);
      }
      setItemDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleSaveCat = async () => {
    if (!catName) return;
    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catName });
      } else {
        await addCategory(catName);
      }
      setCatDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await deleteItem(id);
  };

  const handleDeleteCat = async (id: string) => {
    const hasItems = items.some((item) => item.category === id);
    if (hasItems) {
      alert(
        "Cannot delete a category that has items. Move or delete items first.",
      );
      return;
    }
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
  };

  const getItemsByCategory = (catId: string) =>
    items.filter((i) => i.category === catId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Menu Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCatDialog()}>
            <Tag className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => openItemDialog()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          {categories?.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              No categories yet. Add one to get started.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-1 bg-zinc-100 rounded-full px-3 py-1.5"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  <button
                    onClick={() => openCatDialog(cat)}
                    className="p-0.5 hover:bg-zinc-200 rounded-full"
                  >
                    <Pencil className="w-3 h-3 text-zinc-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteCat(cat.id)}
                    className="p-0.5 hover:bg-red-100 rounded-full"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const catItems = getItemsByCategory(cat.id);
        return (
          <Card key={cat.id}>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">{cat.name}</h2>
              {catItems.length === 0 ? (
                <p className="text-zinc-400 text-sm">
                  No items in this category
                </p>
              ) : (
                <div className="space-y-3">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-900">
                            {item.title}
                          </h3>
                          {!item.available && (
                            <Badge variant="secondary" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-zinc-900">
                          ${item.price.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openItemDialog(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {(() => {
        const catIds = new Set(categories.map((c) => c.id));
        const uncategorized = items.filter((i) => !catIds.has(i.category));
        if (uncategorized.length === 0) return null;
        return (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 text-zinc-500">
                Uncategorized
              </h2>
              <div className="space-y-3">
                {uncategorized.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                  >
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">
                        ${item.price.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openItemDialog(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Margherita Pizza"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fresh tomatoes, mozzarella, basil..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12.99"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={available} onCheckedChange={setAvailable} />
              <Label>Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSaveItem}
              disabled={saving || !title || !price || !category}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Appetizers"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSaveCat}
              disabled={saving || !catName}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCat ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
