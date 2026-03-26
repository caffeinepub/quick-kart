import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle,
  Edit2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ProductCategory } from "../backend";
import { createActorWithConfig } from "../config";
import { useProducts } from "../hooks/useProducts";

interface Order {
  id: bigint;
  itemsJson: string;
  totalAmount: number;
  paymentMethod: { __kind__: "cod" } | { __kind__: "upi" };
  status:
    | { __kind__: "pendingVerification" }
    | { __kind__: "confirmed" }
    | { __kind__: "delivered" };
  address: string;
  customerName: string;
  createdAt: bigint;
}

interface AdminTabProps {
  onBack: () => void;
}

interface ProductForm {
  name: string;
  price: string;
  category: ProductCategory;
  stock: string;
  description: string;
  deliveryTime: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  price: "",
  category: ProductCategory.food,
  stock: "",
  description: "",
  deliveryTime: "",
  imageUrl: "",
};

const PIN = "1234";
const PIN_KEY = "adminPinVerified";

type AdminSection = "products" | "orders";

export function AdminTab({ onBack }: AdminTabProps) {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [verified, setVerified] = useState(
    () => localStorage.getItem(PIN_KEY) === "true",
  );
  const [activeSection, setActiveSection] = useState<AdminSection>("products");

  const { products, loading, refetch } = useProducts();
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<bigint | null>(null);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      const result = await actor.getOrders();
      const sorted = [...result].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
      setOrders(sorted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (verified && activeSection === "orders") {
      fetchOrders();
    }
  }, [verified, activeSection, fetchOrders]);

  const handleConfirmPayment = async (orderId: bigint) => {
    setConfirmingId(orderId);
    try {
      const actor = (await createActorWithConfig()) as any;
      await actor.confirmPayment(orderId);
      toast.success("✅ Payment confirmed!");
      await fetchOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to confirm payment");
    } finally {
      setConfirmingId(null);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === PIN) {
      localStorage.setItem(PIN_KEY, "true");
      setVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: {
    id: number;
    name: string;
    price: number;
    description: string;
    deliveryTime: string;
    image: string;
    category: string;
  }) => {
    const backendCat: ProductCategory =
      p.category === "beverages"
        ? ProductCategory.coldDrinks
        : (p.category as ProductCategory);
    setForm({
      name: p.name,
      price: String(p.price),
      category: backendCat,
      stock: "10",
      description: p.description,
      deliveryTime: p.deliveryTime,
      imageUrl: p.image,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.price ||
      !form.stock ||
      !form.deliveryTime.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      if (editingId !== null) {
        await actor.updateProduct(BigInt(editingId), {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          stock: BigInt(form.stock),
          description: form.description.trim(),
          deliveryTime: form.deliveryTime.trim(),
          imageUrl: form.imageUrl.trim(),
        });
        toast.success("✅ Product updated!");
      } else {
        await actor.addProduct({
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          stock: BigInt(form.stock),
          description: form.description.trim(),
          deliveryTime: form.deliveryTime.trim(),
          imageUrl: form.imageUrl.trim(),
        });
        toast.success("✅ Product added!");
      }
      setShowForm(false);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      await actor.deleteProduct(BigInt(deleteTarget));
      toast.success("🗑️ Product deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // PIN GATE
  if (!verified) {
    return (
      <div
        className="flex flex-col min-h-screen pb-20 bg-background"
        data-ocid="admin.page"
      >
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            data-ocid="admin.close_button"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-black orange-gradient-text">
            ⚙️ Admin Panel
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 px-8 gap-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs"
          >
            <div className="text-5xl text-center mb-6">🔐</div>
            <h2 className="text-xl font-black text-center mb-2">
              Admin Access
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your 4-digit PIN to continue
            </p>
            <div className="space-y-3">
              <Input
                type="password"
                maxLength={4}
                placeholder="Enter PIN"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                className={`text-center text-2xl tracking-[0.5em] font-bold ${pinError ? "border-destructive" : ""}`}
                data-ocid="admin.input"
              />
              {pinError && (
                <p
                  className="text-xs text-destructive text-center"
                  data-ocid="admin.error_state"
                >
                  Incorrect PIN. Please try again.
                </p>
              )}
              <Button
                className="w-full orange-gradient text-white font-bold"
                onClick={handlePinSubmit}
                data-ocid="admin.submit_button"
              >
                Unlock Admin Panel
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen pb-20 bg-background"
      data-ocid="admin.page"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              data-ocid="admin.close_button"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-black orange-gradient-text">
                ⚙️ Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeSection === "products"
                  ? loading
                    ? "Loading..."
                    : `${products.length} products`
                  : ordersLoading
                    ? "Loading..."
                    : `${orders.length} orders`}
              </p>
            </div>
          </div>
          {activeSection === "products" ? (
            <Button
              size="sm"
              className="orange-gradient text-white font-bold rounded-full"
              onClick={openAdd}
              data-ocid="admin.open_modal_button"
            >
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          ) : (
            <button
              type="button"
              onClick={fetchOrders}
              disabled={ordersLoading}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              data-ocid="admin.secondary_button"
            >
              <RefreshCw
                size={15}
                className={ordersLoading ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          <button
            type="button"
            onClick={() => setActiveSection("products")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSection === "products"
                ? "orange-gradient text-white"
                : "bg-muted text-muted-foreground"
            }`}
            data-ocid="admin.products.tab"
          >
            📦 Products
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("orders")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSection === "orders"
                ? "orange-gradient text-white"
                : "bg-muted text-muted-foreground"
            }`}
            data-ocid="admin.orders.tab"
          >
            🧾 Orders
          </button>
        </div>
      </header>

      {/* Products Section */}
      {activeSection === "products" && (
        <div className="px-4 pt-4 space-y-3">
          {loading ? (
            <div className="space-y-3" data-ocid="admin.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
              data-ocid="admin.empty_state"
            >
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No products yet</p>
              <p className="text-sm mt-1">
                Tap "Add" to create your first product
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
                  data-ocid={`admin.item.${i + 1}`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🛒
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.category}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-black text-orange">
                        ₹{p.price}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.deliveryTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                      data-ocid={`admin.edit_button.${i + 1}`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p.id)}
                      className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      data-ocid={`admin.delete_button.${i + 1}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Orders Section */}
      {activeSection === "orders" && (
        <div className="px-4 pt-4 space-y-3">
          {ordersLoading ? (
            <div className="space-y-3" data-ocid="admin.orders.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
              data-ocid="admin.orders.empty_state"
            >
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm mt-1">
                Orders will appear here once customers place them
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {orders.map((order, i) => {
                const isPending =
                  order.status.__kind__ === "pendingVerification";
                const isConfirmed = order.status.__kind__ === "confirmed";
                const isUPI = order.paymentMethod.__kind__ === "upi";
                const isConfirmingThis = confirmingId === order.id;

                let parsedAddress = { flat: "", building: "" };
                try {
                  parsedAddress = JSON.parse(order.address);
                } catch {
                  /* ignore */
                }

                let itemNames: string[] = [];
                try {
                  const parsed = JSON.parse(order.itemsJson);
                  itemNames = parsed.map(
                    (it: { product: { name: string } }) => it.product.name,
                  );
                } catch {
                  /* ignore */
                }

                const displayDate = new Date(
                  Number(order.createdAt) / 1_000_000,
                ).toLocaleString();

                return (
                  <motion.div
                    key={Number(order.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl border border-border p-4 space-y-3"
                    data-ocid={`admin.orders.item.${i + 1}`}
                  >
                    {/* Order header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-black text-sm">
                          Order #{Number(order.id)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {displayDate}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* Payment badge */}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isUPI
                              ? "bg-blue-500/15 text-blue-500"
                              : "bg-green-500/15 text-green-600"
                          }`}
                        >
                          {isUPI ? "📱 UPI" : "💵 COD"}
                        </span>
                        {/* Status badge */}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? "bg-amber/15 text-amber"
                              : isConfirmed
                                ? "bg-green-500/15 text-green-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPending
                            ? "⏳ Pending Verification"
                            : isConfirmed
                              ? "✅ Confirmed"
                              : "📦 Delivered"}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Total
                      </span>
                      <span className="font-black text-orange">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    {/* Address */}
                    {(parsedAddress.flat || parsedAddress.building) && (
                      <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                        📍 {parsedAddress.flat}
                        {parsedAddress.building
                          ? `, ${parsedAddress.building}`
                          : ""}
                      </div>
                    )}

                    {/* Items */}
                    {itemNames.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        🛒 {itemNames.slice(0, 2).join(", ")}
                        {itemNames.length > 2 &&
                          ` and ${itemNames.length - 2} more`}
                      </p>
                    )}

                    {/* Confirm button */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(order.id)}
                        disabled={isConfirmingThis}
                        className="w-full py-2.5 orange-gradient rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                        data-ocid={`admin.orders.confirm_button.${i + 1}`}
                      >
                        {isConfirmingThis ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} /> Confirm Payment
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Add / Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          data-ocid="admin.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Update product details below"
                : "Fill in the product details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="p-name">Product Name *</Label>
              <Input
                id="p-name"
                placeholder="e.g. Margherita Pizza"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="admin.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-price">Price (₹) *</Label>
                <Input
                  id="p-price"
                  type="number"
                  placeholder="299"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  data-ocid="admin.input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-stock">Stock *</Label>
                <Input
                  id="p-stock"
                  type="number"
                  placeholder="50"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  data-ocid="admin.input"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as ProductCategory }))
                }
              >
                <SelectTrigger data-ocid="admin.select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductCategory.food}>🍔 Food</SelectItem>
                  <SelectItem value={ProductCategory.coldDrinks}>
                    🥤 Cold Drinks
                  </SelectItem>
                  <SelectItem value={ProductCategory.grocery}>
                    🛒 Grocery
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-delivery">Delivery Time *</Label>
              <Input
                id="p-delivery"
                placeholder="e.g. 15 min"
                value={form.deliveryTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deliveryTime: e.target.value }))
                }
                data-ocid="admin.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-image">Image URL</Label>
              <Input
                id="p-image"
                placeholder="https://... or /assets/..."
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                data-ocid="admin.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                placeholder="Brief product description..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="resize-none"
                rows={3}
                data-ocid="admin.textarea"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              data-ocid="admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="orange-gradient text-white font-bold"
              onClick={handleSubmit}
              disabled={submitting}
              data-ocid="admin.submit_button"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId !== null ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent
          className="max-w-xs mx-auto rounded-2xl"
          data-ocid="admin.dialog"
        >
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The product will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="admin.delete_button"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
