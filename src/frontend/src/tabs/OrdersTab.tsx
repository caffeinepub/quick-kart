import {
  CheckCircle,
  Circle,
  Home,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { DeliveryAddressCard } from "../components/DeliveryAddressCard";
import { QRCodeCard } from "../components/QRCodeCard";

const mockAddress = {
  flat: "Flat 4B",
  building: "Green Valley Apartments",
  landmark: "City Mall",
  area: "Sector 18, Noida",
  pincode: "201301",
  type: "Home",
};

const steps = [
  { id: 0, label: "Placed", icon: CheckCircle, done: true },
  { id: 1, label: "Preparing", icon: Package, done: false, active: true },
  { id: 2, label: "Out for Delivery", icon: Truck, done: false },
  { id: 3, label: "Delivered", icon: Home, done: false },
];

export function OrdersTab() {
  const [showTracking, setShowTracking] = useState(false);

  return (
    <div className="flex flex-col min-h-screen pb-20" data-ocid="orders.page">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-black orange-gradient-text">
          ⚡ QUICK KART
        </h1>
        <p className="text-xs text-muted-foreground">My Orders</p>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Active Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
          data-ocid="orders.item.1"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-foreground">
                Order #1234
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                3 items · ₹348
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber/20 text-amber">
              🍳 Preparing
            </span>
          </div>

          {/* Items */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs">
                🍕
              </span>
              <span className="text-foreground">Margherita Pizza × 1</span>
              <span className="ml-auto text-muted-foreground">₹299</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs">
                🥤
              </span>
              <span className="text-foreground">Coca Cola × 1</span>
              <span className="ml-auto text-muted-foreground">₹40</span>
            </div>
          </div>

          {/* Status Stepper */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between relative">
              <div
                className="absolute top-3 left-0 right-0 h-0.5 bg-border z-0"
                style={{ margin: "0 16px" }}
              />
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-1 z-10 relative"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        step.done
                          ? "bg-green-500"
                          : step.active
                            ? "bg-orange"
                            : "bg-muted"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle size={14} className="text-white" />
                      ) : (
                        <Icon
                          size={13}
                          className={
                            step.active ? "text-white" : "text-muted-foreground"
                          }
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center leading-tight ${
                        step.done || step.active
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

          {/* ETA */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              ⚡ Estimated: ~18 minutes
            </span>
            <button
              type="button"
              onClick={() => setShowTracking(!showTracking)}
              className="text-xs font-bold text-orange border border-orange/40 rounded-full px-3 py-1.5"
              data-ocid="orders.track.button"
            >
              {showTracking ? "Hide Tracking" : "Track Order"}
            </button>
          </div>
        </motion.div>

        {/* Tracking section */}
        {showTracking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
            data-ocid="orders.tracking.panel"
          >
            <QRCodeCard
              data="QUICKKART|ORDER#1234|₹348|Sector18 Noida"
              title="Order Verification QR"
              subtitle="Share with delivery partner"
            />

            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                <MapPin size={13} className="inline mr-1" />
                Delivery Address
              </h3>
              <DeliveryAddressCard address={mockAddress} />
            </div>
          </motion.div>
        )}

        {/* Past Orders */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Past Orders
          </h2>
          <div
            className="bg-card rounded-xl border border-border px-4 py-3"
            data-ocid="orders.item.2"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">Order #1189</span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  2 items · ₹189 · 2 days ago
                </div>
              </div>
              <span className="text-xs text-green-500 font-semibold">
                ✓ Delivered
              </span>
            </div>
          </div>
          <div
            className="bg-card rounded-xl border border-border px-4 py-3 mt-2"
            data-ocid="orders.item.3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">Order #1102</span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  1 item · ₹249 · 5 days ago
                </div>
              </div>
              <span className="text-xs text-green-500 font-semibold">
                ✓ Delivered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
