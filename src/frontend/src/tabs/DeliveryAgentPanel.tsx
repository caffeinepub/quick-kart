import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createActorWithConfig } from "../config";

const DELIVERY_PIN = "7890";
const STORAGE_KEY = "deliveryPinVerified";

interface Order {
  id: bigint;
  itemsJson: string;
  totalAmount: number;
  paymentMethod: { cod?: null } | { upi?: null } | Record<string, unknown>;
  status:
    | { pending?: null }
    | { pendingVerification?: null }
    | { confirmed?: null }
    | { outForDelivery?: null }
    | { delivered?: null };
  address: string;
  customerName: string;
  createdAt: bigint;
}

interface AddressData {
  flat?: string;
  building?: string;
  landmark?: string;
  area?: string;
  phone?: string;
}

function parseAddress(raw: string): AddressData {
  try {
    return JSON.parse(raw) as AddressData;
  } catch {
    return { area: raw };
  }
}

function parseItems(
  json: string,
): Array<{ name: string; quantity: number; price?: number }> {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function getStatusKey(status: Order["status"]): string {
  return Object.keys(status)[0] ?? "pending";
}

function formatTime(createdAt: bigint): string {
  const ms = Number(createdAt) / 1_000_000;
  const date = new Date(ms);
  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return `${time} · ${day}`;
}

export function DeliveryAgentPanel({ onBack }: { onBack: () => void }) {
  const [verified, setVerified] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      const result: Order[] = await actor.getOrders();
      const relevant = result.filter((o) => {
        const key = getStatusKey(o.status);
        return key === "confirmed" || key === "outForDelivery";
      });
      relevant.sort((a, b) => Number(b.createdAt - a.createdAt));
      setOrders(relevant);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!verified) return;
    fetchOrders();
    const timer = setInterval(() => fetchOrders(true), 15_000);
    return () => clearInterval(timer);
  }, [verified, fetchOrders]);

  function handlePinSubmit() {
    if (pin === DELIVERY_PIN) {
      localStorage.setItem(STORAGE_KEY, "1");
      setVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  }

  async function markDelivered(order: Order) {
    setUpdatingId(order.id);
    try {
      const actor = (await createActorWithConfig()) as any;
      await actor.updateOrderStatus(order.id, { delivered: null });
      toast.success("Order marked as delivered!");
      await fetchOrders(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  function copyAddress(addr: AddressData) {
    const parts = [addr.flat, addr.building, addr.landmark, addr.area].filter(
      Boolean,
    );
    navigator.clipboard.writeText(parts.join(", "));
    toast.success("Address copied!");
  }

  // ── PIN Gate ──────────────────────────────────────────────────────────────
  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            data-ocid="delivery.close_button"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-lg">Delivery Agent</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18 }}
            className="w-full max-w-xs bg-card rounded-3xl border border-blue-500/30 p-8 flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center text-3xl">
              🛵
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Delivery Agent Login</h2>
              <p className="text-sm text-muted-foreground">
                Enter your agent PIN to continue
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                placeholder="Enter PIN"
                className={`w-full text-center text-2xl tracking-[0.5em] font-bold bg-background border-2 rounded-xl px-4 py-3 outline-none transition-colors ${
                  pinError
                    ? "border-destructive"
                    : "border-input focus:border-blue-500"
                }`}
                data-ocid="delivery.input"
              />
              {pinError && (
                <p
                  className="text-destructive text-sm text-center"
                  data-ocid="delivery.error_state"
                >
                  Incorrect PIN. Try again.
                </p>
              )}
              <Button
                onClick={handlePinSubmit}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl py-3"
                data-ocid="delivery.submit_button"
              >
                Verify & Enter
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Main Panel ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background z-10">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          data-ocid="delivery.close_button"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">🛵 Delivery Panel</h1>
          <p className="text-xs text-muted-foreground">
            {orders.length} active{" "}
            {orders.length === 1 ? "delivery" : "deliveries"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders(true)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          data-ocid="delivery.button"
        >
          <RefreshCw
            size={18}
            className={
              refreshing
                ? "animate-spin text-blue-500"
                : "text-muted-foreground"
            }
          />
        </button>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {loading ? (
          <div
            className="flex flex-col gap-4"
            data-ocid="delivery.loading_state"
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-4 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-ocid="delivery.empty_state"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl">
              📦
            </div>
            <p className="text-lg font-bold">No active deliveries</p>
            <p className="text-sm text-muted-foreground text-center">
              No confirmed or out-for-delivery orders right now.
            </p>
          </motion.div>
        ) : (
          orders.map((order, idx) => {
            const statusKey = getStatusKey(order.status);
            const addr = parseAddress(order.address);
            const items = parseItems(order.itemsJson);
            const isOutForDelivery = statusKey === "outForDelivery";
            const isUpdating = updatingId === order.id;

            return (
              <motion.div
                key={String(order.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
                data-ocid={`delivery.item.${idx + 1}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <span className="font-bold text-sm">
                      Order #{String(order.id)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isOutForDelivery
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-orange/20 text-orange"
                    }`}
                  >
                    {isOutForDelivery ? "🛵 Out for Delivery" : "✅ Confirmed"}
                  </span>
                </div>

                <div className="px-4 py-3 flex flex-col gap-3">
                  {/* Customer Info */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Customer
                    </span>
                    <p className="font-bold text-base">{order.customerName}</p>
                    {addr.phone && (
                      <a
                        href={`tel:${addr.phone}`}
                        className="text-blue-500 text-sm font-medium"
                      >
                        📞 {addr.phone}
                      </a>
                    )}
                  </div>

                  {/* Address */}
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Delivery Address
                        </span>
                        {addr.flat && (
                          <p className="text-sm font-bold mt-1">{addr.flat}</p>
                        )}
                        {addr.building && (
                          <p className="text-sm text-foreground">
                            {addr.building}
                          </p>
                        )}
                        {addr.landmark && (
                          <p className="text-sm">
                            <span className="bg-yellow-400/30 text-yellow-600 dark:text-yellow-300 px-1 rounded font-medium">
                              📍 {addr.landmark}
                            </span>
                          </p>
                        )}
                        {addr.area && (
                          <p className="text-sm text-muted-foreground">
                            {addr.area}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyAddress(addr)}
                        className="p-1.5 rounded-lg bg-background border border-border hover:bg-muted transition-colors flex-shrink-0"
                        data-ocid="delivery.button"
                      >
                        <Copy size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Items
                    </span>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {items.length > 0 ? (
                        items.map((item, i) => (
                          <div
                            key={item.name || String(i)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Package
                                size={13}
                                className="text-muted-foreground flex-shrink-0"
                              />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Item details unavailable
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Total
                      </span>
                      <p className="font-bold text-base">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground uppercase">
                      {String(Object.keys(order.paymentMethod)[0] ?? "COD")}
                    </span>
                  </div>

                  {/* Mark Delivered CTA */}
                  {isOutForDelivery && (
                    <Button
                      onClick={() => markDelivered(order)}
                      disabled={isUpdating}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2"
                      data-ocid="delivery.confirm_button"
                    >
                      {isUpdating ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      {isUpdating ? "Updating..." : "✅ Mark as Delivered"}
                    </Button>
                  )}
                  {!isOutForDelivery && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck size={14} />
                      <span>Waiting to be assigned for delivery</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
