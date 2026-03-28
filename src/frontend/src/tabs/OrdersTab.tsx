import {
  CheckCircle,
  Home,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Order } from "../backend";
import { DeliveryAddressCard } from "../components/DeliveryAddressCard";
import { QRCodeCard } from "../components/QRCodeCard";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useAuthStore } from "../store/authStore";
import { useOrderNotificationStore } from "../store/orderNotificationStore";

type OrderStatusKind =
  | "pendingVerification"
  | "confirmed"
  | "outForDelivery"
  | "delivered";

function getStatusKind(status: Order["status"]): OrderStatusKind {
  if ("pendingVerification" in status) return "pendingVerification";
  if ("confirmed" in status) return "confirmed";
  if ("outForDelivery" in status) return "outForDelivery";
  if ("delivered" in status) return "delivered";
  return "pendingVerification";
}

function getStatusLabel(kind: OrderStatusKind) {
  switch (kind) {
    case "pendingVerification":
      return "⏳ Pending";
    case "confirmed":
      return "✅ Confirmed";
    case "outForDelivery":
      return "🛵 On The Way";
    case "delivered":
      return "📦 Delivered";
  }
}

function getStatusColor(kind: OrderStatusKind) {
  switch (kind) {
    case "pendingVerification":
      return "bg-amber-500/20 text-amber-400";
    case "confirmed":
      return "bg-blue-500/20 text-blue-400";
    case "outForDelivery":
      return "bg-orange/20 text-orange";
    case "delivered":
      return "bg-green-500/20 text-green-400";
  }
}

function getStatusGlow(kind: OrderStatusKind) {
  switch (kind) {
    case "pendingVerification":
      return "0 0 12px 3px rgba(245,158,11,0.45)";
    case "confirmed":
      return "0 0 12px 3px rgba(59,130,246,0.45)";
    case "outForDelivery":
      return "0 0 12px 3px rgba(249,115,22,0.55)";
    case "delivered":
      return "0 0 12px 3px rgba(34,197,94,0.45)";
  }
}

function timeAgo(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function parseItems(
  itemsJson: string,
): Array<{ name: string; quantity: number; price: number }> {
  try {
    const arr = JSON.parse(itemsJson);
    if (!Array.isArray(arr)) return [];
    return arr.map((item: Record<string, unknown>) => ({
      name: (item.name as string) || (item.productName as string) || "Item",
      quantity: (item.quantity as number) || 1,
      price: (item.price as number) || (item.discountedPrice as number) || 0,
    }));
  } catch {
    return [];
  }
}

function parseAddress(addressStr: string) {
  try {
    const parsed = JSON.parse(addressStr);
    return {
      flat: parsed.flat || parsed.address || addressStr,
      building: parsed.building || "",
      landmark: parsed.landmark || "",
      area: parsed.area || "",
      pincode: parsed.pincode || "",
      type: parsed.type || "Home",
      phone: parsed.phone || "",
    };
  } catch {
    return {
      flat: addressStr,
      building: "",
      landmark: "",
      area: "",
      pincode: "",
      type: "Home",
      phone: "",
    };
  }
}

const STEPPER_STEPS = [
  { id: 0, label: "Placed", icon: CheckCircle },
  { id: 1, label: "Confirmed", icon: Package },
  { id: 2, label: "On The Way", icon: Truck },
  { id: 3, label: "Delivered", icon: Home },
];

function statusToStep(kind: OrderStatusKind): number {
  switch (kind) {
    case "pendingVerification":
      return 0;
    case "confirmed":
      return 1;
    case "outForDelivery":
      return 2;
    case "delivered":
      return 3;
  }
}

function OrderCard({
  order,
  index,
  justUpdated,
}: {
  order: Order;
  index: number;
  justUpdated: boolean;
}) {
  const [showTracking, setShowTracking] = useState(false);
  const statusKind = getStatusKind(order.status);
  const currentStep = statusToStep(statusKind);
  const items = parseItems(order.itemsJson);
  const address = parseAddress(order.address);
  const isUPI = "upi" in order.paymentMethod;
  const progressPct = (currentStep / 3) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
      data-ocid={`orders.item.${index + 1}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-foreground">
            Order #{Number(order.id)}
          </span>
          <div className="text-xs text-muted-foreground mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} · ₹
            {order.totalAmount} · {timeAgo(order.createdAt)}
          </div>
        </div>
        <motion.span
          key={statusKind}
          className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${getStatusColor(statusKind)}`}
          animate={
            justUpdated
              ? {
                  scale: [1, 1.18, 1],
                  boxShadow: [
                    "0 0 0px 0px transparent",
                    getStatusGlow(statusKind),
                    "0 0 0px 0px transparent",
                  ],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {getStatusLabel(statusKind)}
        </motion.span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs">
              🛍️
            </span>
            <span className="text-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="ml-auto text-muted-foreground">₹{item.price}</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No item details available
          </p>
        )}
      </div>

      {/* Customer Info */}
      <div className="px-4 py-2.5 border-t border-border space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <User size={13} className="text-orange shrink-0" />
          <span className="text-foreground font-medium">
            {order.customerName || "Customer"}
          </span>
        </div>
        {address.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone size={13} className="text-orange shrink-0" />
            <span className="text-muted-foreground">{address.phone}</span>
          </div>
        )}
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={13} className="text-orange shrink-0 mt-0.5" />
          <span className="text-muted-foreground leading-snug">
            {[
              address.flat,
              address.building,
              address.landmark,
              address.area,
              address.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="px-4 py-3 border-t border-border">
        {/* Status Updated micro-banner */}
        <AnimatePresence>
          {justUpdated && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-xs font-semibold text-orange bg-orange/10 rounded-full px-3 py-1 text-center mb-2"
            >
              🔄 Order status updated!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between relative">
          {/* Base gray line */}
          <div
            className="absolute top-3 left-0 right-0 h-0.5 bg-border z-0"
            style={{ margin: "0 16px" }}
          />
          {/* Animated orange progress fill */}
          <motion.div
            className="absolute top-3 h-0.5 bg-orange z-0 origin-left"
            style={{ left: 16, right: 16 }}
            animate={{
              width: `calc(${progressPct}% - 32px * ${progressPct / 100})`,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

          {STEPPER_STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = step.id < currentStep;
            const isActive = step.id === currentStep;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-1 z-10 relative"
              >
                <div className="relative w-7 h-7 flex items-center justify-center">
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-orange/30"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 1.6,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isDone
                        ? "bg-green-500"
                        : isActive
                          ? "bg-orange"
                          : "bg-muted"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle size={14} className="text-white" />
                    ) : (
                      <Icon
                        size={13}
                        className={
                          isActive ? "text-white" : "text-muted-foreground"
                        }
                      />
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs text-center leading-tight ${
                    isDone || isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                  style={{ maxWidth: 56 }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Live Location */}
      <div className="px-4 pb-3">
        <a
          href="https://wa.me/916390359267?text=Hi%2C%20here%20is%20my%20live%20location%3A%20"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white text-sm font-bold rounded-xl py-2.5"
          data-ocid={`orders.whatsapp.location.${index + 1}`}
        >
          <span>📍</span>
          <span>Send Live Location on WhatsApp</span>
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isUPI ? "📱 UPI" : "💵 Cash on Delivery"}
        </span>
        <button
          type="button"
          onClick={() => setShowTracking(!showTracking)}
          className="text-xs font-bold text-orange border border-orange/40 rounded-full px-3 py-1.5"
          data-ocid={`orders.track.button.${index + 1}`}
        >
          {showTracking ? "Hide Tracking" : "Track Order"}
        </button>
      </div>

      {/* Tracking */}
      <AnimatePresence>
        {showTracking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 space-y-3"
            data-ocid={`orders.tracking.panel.${index + 1}`}
          >
            <QRCodeCard
              data={`QUICKKART|ORDER#${Number(order.id)}|₹${order.totalAmount}|${address.area}`}
              title="Order Verification QR"
              subtitle="Share with delivery partner"
            />
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                <MapPin size={13} className="inline mr-1" />
                Delivery Address
              </h3>
              <DeliveryAddressCard address={address} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function OrdersTab() {
  const { user, isLoggedIn } = useAuthStore();
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [justUpdatedIds, setJustUpdatedIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusMapRef = useRef<Map<string, OrderStatusKind>>(new Map());

  const fetchOrders = useCallback(
    async (showSpinner = false) => {
      if (!actor || isFetching || !isLoggedIn || !user) return;
      if (showSpinner) setRefreshing(true);
      try {
        const all = await actor.getOrders();
        const orderIdSet = new Set(user.orderIds.map(String));
        const filtered = all
          .filter((o) => orderIdSet.has(String(Number(o.id))))
          .sort((a, b) => Number(b.createdAt - a.createdAt));
        setOrders(filtered);

        // Detect status changes
        const changedIds: string[] = [];
        for (const order of filtered) {
          const idStr = String(Number(order.id));
          const newStatus = getStatusKind(order.status);
          const prevStatus = statusMapRef.current.get(idStr);
          if (prevStatus !== undefined && prevStatus !== newStatus) {
            changedIds.push(idStr);
          }
          statusMapRef.current.set(idStr, newStatus);
        }

        if (changedIds.length > 0) {
          setJustUpdatedIds((prev) => {
            const next = new Set(prev);
            for (const id of changedIds) next.add(id);
            return next;
          });
          for (const id of changedIds) {
            setTimeout(() => {
              setJustUpdatedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }, 3000);
          }
        }

        useOrderNotificationStore
          .getState()
          .setCurrentOrderCount(filtered.length);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [actor, isFetching, isLoggedIn, user],
  );

  useEffect(() => {
    if (!isLoggedIn || !actor || isFetching) {
      setLoading(false);
      return;
    }
    fetchOrders();
    intervalRef.current = setInterval(() => fetchOrders(), 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, isFetching, isLoggedIn, fetchOrders]);

  const lastUpdatedText = lastUpdated
    ? (() => {
        const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
        return mins < 1 ? "just now" : `${mins}m ago`;
      })()
    : null;

  return (
    <div className="flex flex-col min-h-screen pb-20" data-ocid="orders.page">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black orange-gradient-text">
              ⚡ QUICK KART
            </h1>
            <p className="text-xs text-muted-foreground">My Orders</p>
          </div>
          {isLoggedIn && (
            <div className="flex flex-col items-end gap-0.5">
              <button
                type="button"
                onClick={() => fetchOrders(true)}
                disabled={refreshing || loading}
                className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                data-ocid="orders.refresh.button"
              >
                <motion.div
                  animate={{ rotate: refreshing ? 360 : 0 }}
                  transition={
                    refreshing
                      ? {
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                          ease: "linear",
                        }
                      : {}
                  }
                >
                  <RefreshCw size={16} className="text-muted-foreground" />
                </motion.div>
              </button>
              {lastUpdatedText && (
                <span className="text-[10px] text-muted-foreground">
                  Updated {lastUpdatedText}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Not logged in */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 text-center"
            data-ocid="orders.login.card"
          >
            <p className="text-2xl mb-2">🔐</p>
            <p className="text-sm font-semibold text-foreground">
              Login to view your orders
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to track your order history
            </p>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {isLoggedIn && loading && (
          <div className="space-y-3" data-ocid="orders.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="px-4 py-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isLoggedIn && !loading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-8 text-center"
            data-ocid="orders.empty_state"
          >
            <p className="text-3xl mb-3">📦</p>
            <p className="text-sm font-semibold text-foreground">
              No orders yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your orders will appear here after you place them
            </p>
          </motion.div>
        )}

        {/* Order cards */}
        {isLoggedIn && !loading && orders.length > 0 && (
          <div className="space-y-4" data-ocid="orders.list">
            {orders.map((order, i) => (
              <OrderCard
                key={String(order.id)}
                order={order}
                index={i}
                justUpdated={justUpdatedIds.has(String(Number(order.id)))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
