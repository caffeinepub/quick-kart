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
  Bell,
  CheckCircle,
  Copy,
  CreditCard,
  Edit2,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { HttpAgent } from "@icp-sdk/core/agent";
import { ProductCategory } from "../backend";
import { createActorWithConfig, loadConfig } from "../config";
import { useProducts } from "../hooks/useProducts";
import { StorageClient } from "../utils/StorageClient";

type OrderStatusKind =
  | "pendingVerification"
  | "confirmed"
  | "outForDelivery"
  | "delivered";

interface Order {
  id: bigint;
  itemsJson: string;
  totalAmount: number;
  paymentMethod: { __kind__: "cod" } | { __kind__: "upi" };
  status:
    | { __kind__: "pendingVerification" }
    | { __kind__: "confirmed" }
    | { __kind__: "outForDelivery" }
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

const PIN = "2477";
const PIN_KEY = "adminPinVerified";
const DEFAULT_LOCATION = "Delivering to Areas Near Atraulia";
const DEFAULT_BANNER =
  "/assets/generated/atraulia-escooter-banner.dim_800x400.jpg";

type AdminSection = "products" | "orders" | "settings";

const STATUS_STEPS: { kind: OrderStatusKind; label: string; icon: string }[] = [
  { kind: "pendingVerification", label: "Pending", icon: "⏳" },
  { kind: "confirmed", label: "Confirmed", icon: "✅" },
  { kind: "outForDelivery", label: "On The Way", icon: "🛵" },
  { kind: "delivered", label: "Delivered", icon: "📦" },
];

function getStatusIndex(kind: OrderStatusKind): number {
  return STATUS_STEPS.findIndex((s) => s.kind === kind);
}

function nextStatus(kind: OrderStatusKind): OrderStatusKind | null {
  const idx = getStatusIndex(kind);
  if (idx < 0 || idx >= STATUS_STEPS.length - 1) return null;
  return STATUS_STEPS[idx + 1].kind;
}

function statusToBackend(kind: OrderStatusKind): Record<string, null> {
  return { [kind]: null };
}

function OrderStatusStepper({ current }: { current: OrderStatusKind }) {
  const currentIdx = getStatusIndex(current);
  return (
    <div className="flex items-center w-full gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div
            key={step.kind}
            className="flex items-center"
            style={{ flex: isLast ? "0 0 auto" : 1 }}
          >
            <div
              className="flex flex-col items-center gap-0.5"
              style={{ minWidth: 40 }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  done
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-tight ${
                  done ? "text-orange-500" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mb-3 mx-1 rounded-full transition-all ${
                  i < currentIdx ? "bg-orange-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseAddress(raw: string): {
  flat?: string;
  building?: string;
  landmark?: string;
  area?: string;
  phone?: string;
} {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseItems(
  raw: string,
): { product: { name: string }; quantity?: number }[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function OrderDetailsPage({
  order,
  onClose,
  onMarkDelivered,
  isUpdating,
}: {
  order: Order;
  onClose: () => void;
  onMarkDelivered: () => void;
  isUpdating: boolean;
}) {
  const isUPI = order.paymentMethod.__kind__ === "upi";
  const addr = parseAddress(order.address);
  const items = parseItems(order.itemsJson);
  const displayDate = new Date(
    Number(order.createdAt) / 1_000_000,
  ).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullAddress = [
    addr.flat,
    addr.building,
    addr.landmark ? `Near: ${addr.landmark}` : undefined,
    addr.area,
  ]
    .filter(Boolean)
    .join(", ");

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress).then(() => {
      toast.success("Address copied!");
    });
  };

  return (
    <motion.div
      key="order-details"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-ocid="admin.orders.detail.panel"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
          data-ocid="admin.orders.detail.close_button"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-base">Order Details</h2>
          <p className="text-xs text-muted-foreground">
            Order #{Number(order.id)}
          </p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-4">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-base px-6 py-3 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <span className="text-2xl">🛵</span>
            <span>Out for Delivery</span>
          </div>
        </motion.div>

        {/* Customer Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-orange-500/15 flex items-center justify-center text-xl flex-shrink-0">
              👤
            </div>
            <div>
              <p className="font-black text-base leading-tight">
                {order.customerName || "Customer"}
              </p>
              {addr.phone && (
                <p className="text-xs text-blue-500 font-medium mt-0.5">
                  📞 {addr.phone}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Placed on {displayDate}
              </p>
            </div>
          </div>

          {/* Address */}
          {fullAddress && (
            <div className="bg-muted/60 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  📍 Delivery Address
                </p>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1 text-xs text-blue-500 font-semibold hover:text-blue-600 transition-colors"
                  data-ocid="admin.orders.detail.secondary_button"
                >
                  <Copy size={11} />
                  Copy
                </button>
              </div>
              {addr.flat && <p className="text-sm font-bold">{addr.flat}</p>}
              {addr.building && (
                <p className="text-sm text-muted-foreground">{addr.building}</p>
              )}
              {addr.landmark && (
                <p className="text-sm">
                  <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 font-semibold px-1.5 py-0.5 rounded text-xs">
                    Near: {addr.landmark}
                  </span>
                </p>
              )}
              {addr.area && (
                <p className="text-sm text-muted-foreground">{addr.area}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Items Card */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-card rounded-2xl border border-border p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              🛒 Items Ordered ({items.length})
            </p>
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={`${it.product?.name ?? "item"}-${idx}`}
                  className="flex items-center justify-between"
                  data-ocid={`admin.orders.detail.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-base">
                      🛍️
                    </div>
                    <span className="text-sm font-semibold">
                      {it.product?.name || "Unknown item"}
                    </span>
                  </div>
                  {it.quantity && it.quantity > 0 && (
                    <span className="text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                      ×{it.quantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            💰 Order Summary
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-xl font-black text-orange-500">
              ₹{order.totalAmount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isUPI
                  ? "bg-blue-500/15 text-blue-600"
                  : "bg-green-500/15 text-green-600"
              }`}
            >
              {isUPI ? "📱 UPI" : "💵 Cash on Delivery"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order Time</span>
            <span className="text-sm font-semibold">{displayDate}</span>
          </div>
        </motion.div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            type="button"
            onClick={onMarkDelivered}
            disabled={isUpdating}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all shadow-lg shadow-green-500/25"
            data-ocid="admin.orders.detail.confirm_button"
          >
            {isUpdating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <span className="text-xl">📦</span>
                Mark as Delivered
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

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

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // Banner upload state
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  const [bannerImageUrl, setBannerImageUrl] = useState(
    () => localStorage.getItem("bannerImageUrl") || DEFAULT_BANNER,
  );

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<bigint | null>(null);

  // Order details page state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Settings state
  const [locationText, setLocationText] = useState(
    () => localStorage.getItem("deliveryLocation") || DEFAULT_LOCATION,
  );
  const [savingLocation, setSavingLocation] = useState(false);

  // Flash deal settings state
  const [flashEnabled, setFlashEnabled] = useState(
    () => localStorage.getItem("flashEnabled") !== "false",
  );
  const [flashTitle, setFlashTitle] = useState(
    () => localStorage.getItem("flashTitle") || "🔥 FLASH DEALS",
  );
  const [flashTimerMins, setFlashTimerMins] = useState(
    () => localStorage.getItem("flashTimerMins") || "15",
  );
  const [flashMaxProducts, setFlashMaxProducts] = useState(
    () => localStorage.getItem("flashMaxProducts") || "10",
  );
  const [savingFlash, setSavingFlash] = useState(false);
  const [upiId, setUpiId] = useState(
    () => localStorage.getItem("paymentUpiId") || "9161240484@axl",
  );
  const [qrImageUrl, setQrImageUrl] = useState(
    () => localStorage.getItem("paymentQrImageUrl") || "",
  );
  const [qrUploading, setQrUploading] = useState(false);
  const [qrUploadProgress, setQrUploadProgress] = useState(0);
  const [savingPayment, setSavingPayment] = useState(false);
  // Delivery fee tiers state
  const DEFAULT_TIERS = [
    { label: "0-2 km", price: 20 },
    { label: "2-5 km", price: 40 },
    { label: "5+ km", price: 60 },
  ];
  const [deliveryTiers, setDeliveryTiers] = useState<
    Array<{ label: string; price: number }>
  >(() => {
    try {
      const stored = localStorage.getItem("deliveryTiers");
      return stored ? JSON.parse(stored) : DEFAULT_TIERS;
    } catch {
      return DEFAULT_TIERS;
    }
  });
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);
  const [flashSubscribers, setFlashSubscribers] = useState<
    Array<{ name: string; phone: string }>
  >([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [notifyingUsers, setNotifyingUsers] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);

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

  const fetchFlashSubscribers = useCallback(async () => {
    setLoadingSubscribers(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      const subs = await actor.getFlashNotifySubscribers();
      setFlashSubscribers(
        subs.map((s: any) => ({ name: s.name, phone: s.phone })),
      );
    } catch {
      // silently fail
    } finally {
      setLoadingSubscribers(false);
    }
  }, []);

  useEffect(() => {
    if (verified && activeSection === "settings") {
      fetchFlashSubscribers();
    }
  }, [verified, activeSection, fetchFlashSubscribers]);
  // eslint-disable-next-line

  const handleUpdateStatus = async (
    orderId: bigint,
    newStatus: OrderStatusKind,
  ) => {
    setUpdatingStatusId(orderId);
    // Optimistic update: reflect change in UI immediately
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          updatedOrder = { ...o, status: { __kind__: newStatus } };
          return updatedOrder;
        }
        return o;
      }),
    );

    const labels: Record<OrderStatusKind, string> = {
      pendingVerification: "Pending",
      confirmed: "✅ Order Confirmed!",
      outForDelivery: "🛵 Out for Delivery!",
      delivered: "📦 Marked as Delivered!",
    };

    if (newStatus === "outForDelivery") {
      // Do NOT call backend — outForDelivery is UI-only
      toast.success(labels[newStatus]);
      // Show order details page
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
      setUpdatingStatusId(null);
      return;
    }

    try {
      const actor = (await createActorWithConfig()) as any;
      await actor.updateOrderStatus(orderId, statusToBackend(newStatus));
      toast.success(labels[newStatus]);
      // Re-fetch after short delay to sync confirmed state from backend
      setTimeout(() => fetchOrders(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
      // Revert optimistic update on failure
      await fetchOrders();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveLocation = () => {
    setSavingLocation(true);
    const trimmed = locationText.trim() || DEFAULT_LOCATION;
    localStorage.setItem("deliveryLocation", trimmed);
    setLocationText(trimmed);
    window.dispatchEvent(new Event("deliveryLocationUpdated"));
    toast.success("✅ Location updated!");
    setSavingLocation(false);
  };

  const handleSaveFlashSettings = () => {
    setSavingFlash(true);
    localStorage.setItem("flashEnabled", flashEnabled ? "true" : "false");
    localStorage.setItem("flashTitle", flashTitle.trim() || "🔥 FLASH DEALS");
    localStorage.setItem("flashTimerMins", flashTimerMins || "15");
    localStorage.setItem("flashMaxProducts", flashMaxProducts || "10");
    window.dispatchEvent(new Event("flashSettingsUpdated"));
    toast.success("⚡ Flash deal settings saved!");
    setSavingFlash(false);
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

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageUploadProgress(0);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) =>
        setImageUploadProgress(pct),
      );
      const url = await storageClient.getDirectURL(hash);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("✅ Image uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setImageUploading(false);
      setImageUploadProgress(0);
    }
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    setBannerUploadProgress(0);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) =>
        setBannerUploadProgress(pct),
      );
      const url = await storageClient.getDirectURL(hash);
      localStorage.setItem("bannerImageUrl", url);
      setBannerImageUrl(url);
      window.dispatchEvent(new Event("bannerImageUpdated"));
      toast.success("✅ Banner updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Banner upload failed");
    } finally {
      setBannerUploading(false);
      setBannerUploadProgress(0);
    }
  };

  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    setQrUploadProgress(0);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) =>
        setQrUploadProgress(pct),
      );
      const url = await storageClient.getDirectURL(hash);
      localStorage.setItem("paymentQrImageUrl", url);
      setQrImageUrl(url);
      window.dispatchEvent(new Event("paymentQrUpdated"));
      toast.success("✅ QR code uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "QR upload failed");
    } finally {
      setQrUploading(false);
      setQrUploadProgress(0);
    }
  };

  const handleSavePaymentSettings = () => {
    setSavingPayment(true);
    localStorage.setItem("paymentUpiId", upiId.trim());
    window.dispatchEvent(new Event("paymentSettingsUpdated"));
    toast.success("✅ Payment settings saved!");
    setSavingPayment(false);
  };

  const handleSaveDeliveryFee = () => {
    setSavingDeliveryFee(true);
    localStorage.setItem("deliveryTiers", JSON.stringify(deliveryTiers));
    window.dispatchEvent(new Event("deliveryTiersUpdated"));
    toast.success("✅ Delivery fee settings saved!");
    setSavingDeliveryFee(false);
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

  const headerSubtitle =
    activeSection === "products"
      ? loading
        ? "Loading..."
        : `${products.length} products`
      : activeSection === "orders"
        ? ordersLoading
          ? "Loading..."
          : `${orders.length} orders`
        : "App Settings";

  // Order stats
  const pendingCount = orders.filter(
    (o) => o.status.__kind__ === "pendingVerification",
  ).length;
  const outForDeliveryCount = orders.filter(
    (o) => o.status.__kind__ === "outForDelivery",
  ).length;

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
              <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
          {activeSection === "products" && (
            <Button
              size="sm"
              className="orange-gradient text-white font-bold rounded-full"
              onClick={openAdd}
              data-ocid="admin.open_modal_button"
            >
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          )}
          {activeSection === "orders" && (
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
          <button
            type="button"
            onClick={() => setActiveSection("settings")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSection === "settings"
                ? "orange-gradient text-white"
                : "bg-muted text-muted-foreground"
            }`}
            data-ocid="admin.settings.tab"
          >
            ⚙️ Settings
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
          {/* Summary Stats */}
          {!ordersLoading && orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 flex-wrap"
              data-ocid="admin.orders.panel"
            >
              <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                <ShoppingBag size={12} className="text-orange-500" />
                <span className="text-xs font-bold">{orders.length} Total</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <span className="text-xs">⏳</span>
                  <span className="text-xs font-bold text-amber-600">
                    {pendingCount} Pending
                  </span>
                </div>
              )}
              {outForDeliveryCount > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full">
                  <Truck size={12} className="text-blue-500" />
                  <span className="text-xs font-bold text-blue-500">
                    {outForDeliveryCount} Out for Delivery
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {ordersLoading ? (
            <div className="space-y-4" data-ocid="admin.orders.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
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
                const statusKind = order.status.__kind__ as OrderStatusKind;
                const isUPI = order.paymentMethod.__kind__ === "upi";
                const isUpdatingThis = updatingStatusId === order.id;
                const next = nextStatus(statusKind);
                const isDelivered = statusKind === "delivered";

                let parsedAddress: {
                  flat?: string;
                  building?: string;
                  landmark?: string;
                  area?: string;
                  phone?: string;
                } = {};
                try {
                  parsedAddress = JSON.parse(order.address);
                } catch {
                  /* ignore */
                }

                let items: { product: { name: string }; quantity?: number }[] =
                  [];
                try {
                  items = JSON.parse(order.itemsJson);
                } catch {
                  /* ignore */
                }

                const displayDate = new Date(
                  Number(order.createdAt) / 1_000_000,
                ).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const actionConfig: Record<
                  OrderStatusKind,
                  { label: string; className: string } | null
                > = {
                  pendingVerification: {
                    label: "✅ Confirm Order",
                    className: "orange-gradient text-white",
                  },
                  confirmed: {
                    label: "🛵 Mark Out for Delivery",
                    className: "bg-blue-600 hover:bg-blue-700 text-white",
                  },
                  outForDelivery: {
                    label: "📦 Mark Delivered",
                    className: "bg-green-600 hover:bg-green-700 text-white",
                  },
                  delivered: null,
                };

                const action = actionConfig[statusKind];

                return (
                  <motion.div
                    key={Number(order.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                    data-ocid={`admin.orders.item.${i + 1}`}
                  >
                    {/* Order Header */}
                    <div className="px-4 pt-4 pb-3 border-b border-border/50">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-black text-sm">
                            Order #{Number(order.id)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {displayDate}
                          </p>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isUPI
                                ? "bg-blue-500/15 text-blue-500"
                                : "bg-green-500/15 text-green-600"
                            }`}
                          >
                            {isUPI ? "📱 UPI" : "💵 COD"}
                          </span>
                          {isDelivered && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-600">
                              ✅ Delivered
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Stepper */}
                      <div className="mt-3">
                        <OrderStatusStepper current={statusKind} />
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="px-4 py-3 space-y-3">
                      {/* Customer info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-sm">
                            {order.customerName || "Customer"}
                          </p>
                          {parsedAddress.phone && (
                            <p className="text-xs text-blue-500 font-medium mt-0.5">
                              📞 {parsedAddress.phone}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Total:{" "}
                            <span className="font-bold text-orange-500">
                              ₹{order.totalAmount}
                            </span>
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-base">
                          👤
                        </div>
                      </div>

                      {/* Address */}
                      {(parsedAddress.flat ||
                        parsedAddress.building ||
                        parsedAddress.landmark) && (
                        <div className="bg-muted/60 rounded-xl px-3 py-2.5 space-y-0.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            📍 Delivery Address
                          </p>
                          {parsedAddress.flat && (
                            <p className="text-xs font-bold">
                              {parsedAddress.flat}
                            </p>
                          )}
                          {parsedAddress.building && (
                            <p className="text-xs text-muted-foreground">
                              {parsedAddress.building}
                            </p>
                          )}
                          {parsedAddress.landmark && (
                            <p className="text-xs">
                              <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 font-semibold px-1 rounded">
                                Near: {parsedAddress.landmark}
                              </span>
                            </p>
                          )}
                          {parsedAddress.area && (
                            <p className="text-xs text-muted-foreground">
                              {parsedAddress.area}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      {items.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            🛒 Items ({items.length})
                          </p>
                          <div className="space-y-1">
                            {items.map((it, idx) => (
                              <div
                                key={`${it.product?.name ?? "item"}-${idx}`}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-foreground">
                                  {it.product?.name || "Unknown item"}
                                </span>
                                {it.quantity && it.quantity > 1 && (
                                  <span className="text-muted-foreground font-medium">
                                    ×{it.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      {action && next && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, next)}
                          disabled={isUpdatingThis}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all ${action.className}`}
                          data-ocid={`admin.orders.confirm_button.${i + 1}`}
                        >
                          {isUpdatingThis ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Updating...
                            </>
                          ) : (
                            action.label
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Settings Section */}
      {activeSection === "settings" && (
        <div className="px-4 pt-6 space-y-4">
          {/* Promotional Banner Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
            data-ocid="admin.settings.panel"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl orange-gradient flex items-center justify-center">
                <ImageIcon size={16} className="text-white" />
              </div>
              <div>
                <p className="font-black text-sm">Promotional Banner</p>
                <p className="text-xs text-muted-foreground">
                  Hero image shown on the customer home screen
                </p>
              </div>
            </div>

            {/* Banner Preview */}
            <div className="rounded-xl overflow-hidden border border-border h-40">
              <img
                src={bannerImageUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
                data-ocid="admin.settings.banner_preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_BANNER;
                }}
              />
            </div>

            {/* Upload button */}
            <div className="space-y-2">
              <label
                htmlFor="banner-image-file"
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border cursor-pointer text-sm font-semibold transition-colors hover:bg-muted ${
                  bannerUploading ? "opacity-50 pointer-events-none" : ""
                }`}
                data-ocid="admin.settings.banner_upload"
              >
                {bannerUploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} />
                )}
                {bannerUploading
                  ? `Uploading... ${bannerUploadProgress}%`
                  : "Upload New Banner"}
                <input
                  id="banner-image-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerFileChange}
                  disabled={bannerUploading}
                />
              </label>
              {/* Progress bar */}
              {bannerUploading && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${bannerUploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Recommended: 600×400px or wider. The image will scale to fit
                mobile screens.
              </p>
            </div>
          </motion.div>

          {/* Delivery Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
            data-ocid="admin.settings.panel"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl orange-gradient flex items-center justify-center">
                <Settings size={16} className="text-white" />
              </div>
              <div>
                <p className="font-black text-sm">Delivery Location</p>
                <p className="text-xs text-muted-foreground">
                  Shown on the home screen header
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-input">Location Text</Label>
              <Input
                id="location-input"
                placeholder={DEFAULT_LOCATION}
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                data-ocid="admin.settings.input"
              />
              <p className="text-xs text-muted-foreground">
                This text appears next to the 📍 pin on the home screen.
              </p>
            </div>

            <Button
              className="w-full orange-gradient text-white font-bold"
              onClick={handleSaveLocation}
              disabled={savingLocation}
              data-ocid="admin.settings.save_button"
            >
              {savingLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Location
            </Button>
          </motion.div>

          {/* Flash Deals Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
            data-ocid="admin.settings.flash_deals"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl orange-gradient flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <p className="font-black text-sm">Flash Deals</p>
                <p className="text-xs text-muted-foreground">
                  Control the flash deals section on the home screen
                </p>
              </div>
            </div>

            {/* Enable/Disable toggle */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Enable Flash Deals</p>
                <p className="text-xs text-muted-foreground">
                  Show flash deals section on home screen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFlashEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  flashEnabled ? "bg-orange-500" : "bg-muted"
                }`}
                data-ocid="admin.settings.flash_toggle"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    flashEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Section Title */}
            <div className="space-y-1">
              <Label htmlFor="flash-title">Section Title</Label>
              <Input
                id="flash-title"
                placeholder="🔥 FLASH DEALS"
                value={flashTitle}
                onChange={(e) => setFlashTitle(e.target.value)}
                disabled={!flashEnabled}
                data-ocid="admin.settings.flash_title"
              />
            </div>

            {/* Countdown Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="flash-timer">Countdown (minutes)</Label>
                <Input
                  id="flash-timer"
                  type="number"
                  min="1"
                  max="1440"
                  placeholder="15"
                  value={flashTimerMins}
                  onChange={(e) => setFlashTimerMins(e.target.value)}
                  disabled={!flashEnabled}
                  data-ocid="admin.settings.flash_timer"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="flash-max">Max Products Shown</Label>
                <Input
                  id="flash-max"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                  value={flashMaxProducts}
                  onChange={(e) => setFlashMaxProducts(e.target.value)}
                  disabled={!flashEnabled}
                  data-ocid="admin.settings.flash_max"
                />
              </div>
            </div>

            <Button
              className="w-full orange-gradient text-white font-bold rounded-xl"
              onClick={handleSaveFlashSettings}
              disabled={savingFlash}
              data-ocid="admin.settings.flash_save"
            >
              {savingFlash ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Flash Deal Settings
            </Button>

            {/* Flash Notify Subscribers */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Waiting for Notification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loadingSubscribers
                      ? "Loading..."
                      : `${flashSubscribers.length} user${flashSubscribers.length !== 1 ? "s" : ""} subscribed`}
                  </p>
                </div>
                {flashSubscribers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-500 border-orange-500"
                    onClick={() => setShowNotifyDialog(true)}
                    data-ocid="admin.settings.notify_users_button"
                  >
                    <Bell size={14} className="mr-1" /> Notify Users
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Delivery Fee Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
            data-ocid="admin.settings.delivery_fee_card"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl orange-gradient flex items-center justify-center">
                <Truck size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delivery Fee Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Set fees per distance range. Applied to all new orders.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {deliveryTiers.map((tier, idx) => (
                <div key={tier.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {tier.label}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={0}
                        className="pl-7"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...deliveryTiers];
                          updated[idx] = {
                            ...updated[idx],
                            price: Number.parseInt(e.target.value) || 0,
                          };
                          setDeliveryTiers(updated);
                        }}
                        data-ocid={`admin.settings.delivery_fee_input_${idx}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="orange-gradient text-white font-bold w-full"
              onClick={handleSaveDeliveryFee}
              disabled={savingDeliveryFee}
              data-ocid="admin.settings.save_delivery_fee_button"
            >
              {savingDeliveryFee ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Delivery Fee Settings
            </Button>
          </motion.div>

          {/* Payment Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4"
            data-ocid="admin.settings.payment_card"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl orange-gradient flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Payment Settings</h3>
                <p className="text-xs text-muted-foreground">
                  UPI ID and QR code shown at checkout
                </p>
              </div>
            </div>

            {/* UPI ID input */}
            <div className="space-y-1.5">
              <Label htmlFor="upi-id-input">UPI ID</Label>
              <Input
                id="upi-id-input"
                placeholder="yourname@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                data-ocid="admin.settings.upi_id_input"
              />
            </div>

            {/* QR Code upload */}
            <div className="space-y-2">
              <Label>UPI QR Code</Label>
              {qrImageUrl ? (
                <div className="flex justify-center">
                  <img
                    src={qrImageUrl}
                    alt="UPI QR Code"
                    className="max-w-[180px] w-full rounded-xl border border-border object-contain"
                  />
                </div>
              ) : null}
              <label
                htmlFor="qr-image-file"
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border cursor-pointer text-sm font-semibold transition-colors hover:bg-muted ${
                  qrUploading ? "opacity-50 pointer-events-none" : ""
                }`}
                data-ocid="admin.settings.qr_upload_button"
              >
                {qrUploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} />
                )}
                {qrUploading
                  ? `Uploading... ${qrUploadProgress}%`
                  : "Upload QR Code"}
                <input
                  id="qr-image-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrFileChange}
                  disabled={qrUploading}
                />
              </label>
              {qrUploading && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${qrUploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload your UPI QR code. Shown to customers during checkout.
              </p>
            </div>

            <Button
              className="orange-gradient text-white font-bold w-full"
              onClick={handleSavePaymentSettings}
              disabled={savingPayment}
              data-ocid="admin.settings.save_payment_button"
            >
              {savingPayment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Payment Settings
            </Button>
          </motion.div>
        </div>
      )}

      {/* Flash Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          data-ocid="admin.notify.dialog"
        >
          <DialogHeader>
            <DialogTitle>Notify Subscribers</DialogTitle>
            <DialogDescription>
              These users will be informed that Flash Deals are now live.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 py-2">
            {flashSubscribers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subscribers yet.
              </p>
            ) : (
              flashSubscribers.map((sub, i) => (
                <div
                  key={`${sub.phone}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm font-medium">{sub.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {sub.phone}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNotifyDialog(false)}
              data-ocid="admin.notify.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="orange-gradient text-white font-bold"
              disabled={notifyingUsers || flashSubscribers.length === 0}
              onClick={async () => {
                setNotifyingUsers(true);
                try {
                  const actor = (await createActorWithConfig()) as any;
                  await actor.clearFlashNotifySubscribers();
                  window.dispatchEvent(new CustomEvent("flashDealsNotified"));
                  toast.success(`Notified ${flashSubscribers.length} users!`);
                  setFlashSubscribers([]);
                  setShowNotifyDialog(false);
                } catch {
                  toast.error("Failed to notify users.");
                } finally {
                  setNotifyingUsers(false);
                }
              }}
              data-ocid="admin.notify.confirm_button"
            >
              {notifyingUsers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {/* Product Image */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              {/* File upload button */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="p-image-file"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer text-sm transition-colors hover:bg-muted ${imageUploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {imageUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {imageUploading
                    ? `Uploading... ${imageUploadProgress}%`
                    : "Upload from device"}
                  <input
                    id="p-image-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                    disabled={imageUploading}
                  />
                </label>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="w-10 h-10 rounded object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              {/* Progress bar */}
              {imageUploading && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${imageUploadProgress}%` }}
                  />
                </div>
              )}
              {/* URL fallback */}
              <Input
                id="p-image"
                placeholder="Or paste image URL (optional fallback)"
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

      {/* Order Details Page — slides in from right */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsPage
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onMarkDelivered={async () => {
              await handleUpdateStatus(selectedOrder.id, "delivered");
              setSelectedOrder(null);
            }}
            isUpdating={updatingStatusId === selectedOrder.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
