import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeliveryAddressCard } from "../components/DeliveryAddressCard";
import { QRCodeCard } from "../components/QRCodeCard";
import { createActorWithConfig } from "../config";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const COUPONS: Record<string, number> = {
  QUICK10: 0.1,
  SAVE20: 0.2,
  FLASH50: 0.5,
};

const DISTANCE_TIERS = [
  { label: "2 km", price: 19, desc: "Up to 2 km" },
  { label: "5 km", price: 40, desc: "Up to 5 km" },
  { label: "5km+", price: 60, desc: "5 km and above" },
  { label: "10km+", price: 70, desc: "10 km and above" },
];

interface AddressFormData {
  flat: string;
  building: string;
  landmark: string;
  area: string;
  pincode: string;
  type: string;
}

type CheckoutStep = "cart" | "payment" | "upi" | "success-cod" | "success-upi";

export function CartTab({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { isLoggedIn, user, addOrderId } = useAuthStore();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [selectedDistanceIdx, setSelectedDistanceIdx] = useState(0);
  const [address, setAddress] = useState<AddressFormData>({
    flat: "",
    building: "",
    landmark: "",
    area: "",
    pincode: "",
    type: "Home",
  });
  const [savedAddress, setSavedAddress] = useState<AddressFormData | null>(
    null,
  );
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Pre-fill address from auth store
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user?.address]);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = DISTANCE_TIERS[selectedDistanceIdx].price;
  const platformFee = 5;
  const gst = Math.round(subtotal * 0.05);
  const discount = appliedCoupon
    ? Math.round(subtotal * (COUPONS[appliedCoupon] ?? 0))
    : 0;
  const total = subtotal + deliveryFee + platformFee + gst - discount;

  const handleApplyCoupon = () => {
    const code = couponInput.toUpperCase().trim();
    if (COUPONS[code]) {
      setAppliedCoupon(code);
      toast.success(
        `🎉 Coupon ${code} applied! ${Math.round(COUPONS[code] * 100)}% off`,
      );
    } else {
      toast.error("Invalid coupon code");
    }
    setCouponInput("");
  };

  const handleSaveAddress = () => {
    if (!address.flat || !address.building || !address.pincode) {
      toast.error("Please fill required fields");
      return;
    }
    setSavedAddress({ ...address });
    toast.success("📍 Address saved!");
  };

  const handleProceedToPay = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    if (!savedAddress) {
      toast.error("Please save a delivery address first");
      return;
    }
    setStep("payment");
  };

  const handleCOD = async () => {
    if (!savedAddress) return;
    setPlacingOrder(true);
    try {
      const backend = await createActorWithConfig();
      const id = await backend.placeOrder({
        itemsJson: JSON.stringify(items),
        totalAmount: total,
        paymentMethod: { __kind__: "cod" },
        address: JSON.stringify(savedAddress),
        customerName: user?.name ?? "Guest",
      });
      const numId = Number(id);
      setOrderId(numId);
      addOrderId(numId);
      clearCart();
      setStep("success-cod");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleIHavePaid = async () => {
    if (!savedAddress) return;
    setPlacingOrder(true);
    try {
      const backend = await createActorWithConfig();
      const id = await backend.placeOrder({
        itemsJson: JSON.stringify(items),
        totalAmount: total,
        paymentMethod: { __kind__: "upi" },
        address: JSON.stringify(savedAddress),
        customerName: user?.name ?? "Guest",
      });
      const numId = Number(id);
      setOrderId(numId);
      addOrderId(numId);
      clearCart();
      setStep("success-upi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("9161240484@axl").then(() => {
      toast.success("UPI ID copied!");
    });
  };

  const resetCheckout = () => {
    setStep("cart");
    setOrderId(null);
  };

  // SUCCESS COD
  if (step === "success-cod") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-screen pb-20 px-6 text-center"
        data-ocid="cart.success_state"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-black text-foreground mb-1">
          Order Placed!
        </h2>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-1">Order #{orderId}</p>
        )}
        <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 w-full max-w-xs">
          <p className="text-green-600 font-bold text-sm">
            💵 Cash on Delivery
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Pay ₹{total} on delivery
          </p>
        </div>
        <div className="text-orange font-bold text-sm mt-3">
          ⚡ ETA: 18 minutes
        </div>
        <button
          type="button"
          className="mt-6 orange-gradient text-white font-bold px-8 py-3 rounded-full"
          onClick={resetCheckout}
          data-ocid="cart.primary_button"
        >
          Back to Home
        </button>
      </motion.div>
    );
  }

  // SUCCESS UPI (PENDING)
  if (step === "success-upi") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-screen pb-20 px-6 text-center"
        data-ocid="cart.success_state"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-5xl mb-4"
        >
          ⏳
        </motion.div>
        <h2 className="text-xl font-black text-foreground mb-1">
          Payment Pending Verification
        </h2>
        {orderId && (
          <p className="text-sm text-orange font-bold mb-1">Order #{orderId}</p>
        )}
        <p className="text-muted-foreground text-sm max-w-xs mt-2">
          Your order will be confirmed once we verify your UPI payment.
        </p>
        <div className="mt-4 bg-amber/10 border border-amber/30 rounded-xl px-5 py-4 w-full max-w-xs">
          <p className="text-amber font-bold text-sm flex items-center justify-center gap-1">
            <Clock size={14} /> You&apos;ll receive confirmation shortly
          </p>
        </div>
        <button
          type="button"
          className="mt-6 orange-gradient text-white font-bold px-8 py-3 rounded-full"
          onClick={resetCheckout}
          data-ocid="cart.primary_button"
        >
          Back to Home
        </button>
      </motion.div>
    );
  }

  if (items.length === 0 && step === "cart") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen pb-20 px-6 text-center"
        data-ocid="cart.empty_state"
      >
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-sm">
          Add items to get started
        </p>
      </div>
    );
  }

  // PAYMENT METHOD SELECTION
  if (step === "payment") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col min-h-screen pb-20"
        data-ocid="cart.payment.panel"
      >
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <h1 className="text-lg font-black orange-gradient-text">
            💳 Payment
          </h1>
          <p className="text-xs text-muted-foreground">Total: ₹{total}</p>
        </header>
        <div className="px-4 pt-6 space-y-4">
          <h2 className="text-base font-black text-foreground">
            Choose Payment Method
          </h2>

          {/* COD Card */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleCOD}
            disabled={placingOrder}
            className="w-full bg-card border-2 border-green-500/40 rounded-2xl p-5 flex items-center gap-4 text-left hover:border-green-500 hover:bg-green-500/5 transition-all disabled:opacity-50"
            data-ocid="cart.cod.primary_button"
          >
            <div className="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              💵
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">
                Pay when your order arrives
              </p>
            </div>
            {placingOrder ? (
              <Loader2 size={18} className="animate-spin text-green-500" />
            ) : (
              <ChevronRight size={18} className="text-muted-foreground" />
            )}
          </motion.button>

          {/* UPI Card */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("upi")}
            disabled={placingOrder}
            className="w-full bg-card border-2 border-blue-500/40 rounded-2xl p-5 flex items-center gap-4 text-left hover:border-blue-500 hover:bg-blue-500/5 transition-all disabled:opacity-50"
            data-ocid="cart.upi.primary_button"
          >
            <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              📱
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">UPI Payment</p>
              <p className="text-sm text-muted-foreground">
                Pay via UPI instantly
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </motion.button>

          <button
            type="button"
            onClick={() => setStep("cart")}
            className="flex items-center gap-1 text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors"
            data-ocid="cart.cancel_button"
          >
            <ChevronLeft size={16} />
            Back to Cart
          </button>
        </div>
      </motion.div>
    );
  }

  // UPI PAYMENT SCREEN
  if (step === "upi") {
    const upiLink = `upi://pay?pa=9161240484@axl&pn=QuickKart&am=${total}&cu=INR`;
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col min-h-screen pb-20"
        data-ocid="cart.upi.panel"
      >
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <h1 className="text-lg font-black orange-gradient-text">
            📱 Pay via UPI
          </h1>
          <p className="text-xs text-muted-foreground">
            Quick & secure payment
          </p>
        </header>
        <div className="px-4 pt-5 space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Amount to pay</p>
            <p className="text-4xl font-black text-orange">₹{total}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
              UPI ID
            </p>
            <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
              <span className="font-mono font-bold text-foreground">
                9161240484@axl
              </span>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="flex items-center gap-1 text-orange text-xs font-semibold"
                data-ocid="cart.upi.secondary_button"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          </div>

          <QRCodeCard
            data={upiLink}
            title="Scan to Pay"
            subtitle="Any UPI app"
          />

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-500 mb-2">
              📋 How to pay
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open any UPI app (GPay, PhonePe, Paytm...)</li>
              <li>Scan the QR code or enter UPI ID</li>
              <li>Pay ₹{total} and note the transaction</li>
              <li>Click &ldquo;I Have Paid&rdquo; below</li>
            </ol>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleIHavePaid}
            disabled={placingOrder}
            className="w-full py-4 orange-gradient rounded-2xl text-white font-black text-base shadow-orange flex items-center justify-center gap-2"
            data-ocid="cart.upi.submit_button"
          >
            {placingOrder ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Placing Order...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> I Have Paid
              </>
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => setStep("payment")}
            className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            data-ocid="cart.cancel_button"
          >
            <ChevronLeft size={16} />
            Change payment method
          </button>
        </div>
      </motion.div>
    );
  }

  // CART SCREEN
  return (
    <div className="flex flex-col min-h-screen pb-20" data-ocid="cart.page">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-black orange-gradient-text">
          ⚡ QUICK KART
        </h1>
        <p className="text-xs text-muted-foreground">
          {items.length} items in cart
        </p>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card rounded-xl border border-border p-3 flex gap-3"
                data-ocid={`cart.item.${idx + 1}`}
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ₹{item.product.price} each
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 orange-gradient rounded-full px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-white"
                        data-ocid={`cart.secondary_button.${idx + 1}`}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-white text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-white"
                        data-ocid={`cart.primary_button.${idx + 1}`}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        ₹{item.product.price * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-destructive"
                        data-ocid={`cart.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coupon */}
        <div
          className="bg-card rounded-xl border border-border p-3"
          data-ocid="cart.coupon.panel"
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-orange" />
            <span className="text-sm font-semibold">Coupon Code</span>
          </div>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <span className="text-sm font-bold text-green-600">
                🎉 {appliedCoupon} applied!
              </span>
              <button
                type="button"
                onClick={() => setAppliedCoupon("")}
                className="text-xs text-muted-foreground"
                data-ocid="cart.cancel_button"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="QUICK10, SAVE20, FLASH50"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                data-ocid="cart.input"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="orange-gradient text-white text-sm font-bold px-4 py-2 rounded-lg"
                data-ocid="cart.submit_button"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Distance Selector */}
        <div
          className="bg-card rounded-xl border border-border p-4"
          data-ocid="cart.distance.panel"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-orange" />
            <span className="text-sm font-bold">📍 Delivery Distance</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DISTANCE_TIERS.map((tier, idx) => (
              <button
                type="button"
                key={tier.label}
                onClick={() => setSelectedDistanceIdx(idx)}
                className={`flex-1 min-w-fit px-3 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                  selectedDistanceIdx === idx
                    ? "orange-gradient text-white border-transparent shadow-orange"
                    : "bg-muted text-foreground border-border"
                }`}
                data-ocid="cart.distance.toggle"
              >
                <div>{tier.label}</div>
                <div
                  className={`text-xs font-semibold ${selectedDistanceIdx === idx ? "text-white/80" : "text-muted-foreground"}`}
                >
                  ₹{tier.price}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🛯 Faster delivery for longer distances may take up to 30 min
          </p>
        </div>

        {/* Price Breakdown */}
        <div
          className="bg-card rounded-xl border border-border p-4 space-y-2"
          data-ocid="cart.price.panel"
        >
          <h3 className="font-bold text-sm mb-3">Bill Details</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Delivery Fee
              <span className="ml-1 text-xs text-orange">
                ({DISTANCE_TIERS[selectedDistanceIdx].label})
              </span>
            </span>
            <span className="font-medium">₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee</span>
            <span className="font-medium">₹{platformFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST (5%)</span>
            <span className="font-medium">₹{gst}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-500">Discount ({appliedCoupon})</span>
              <span className="font-medium text-green-500">-₹{discount}</span>
            </div>
          )}
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between">
            <span className="font-bold text-base">Total</span>
            <span className="font-black text-lg text-orange">₹{total}</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Zap size={12} className="text-amber" />
            <span className="text-xs text-amber font-semibold">
              ⚡ Estimated: 18 minutes
            </span>
          </div>
        </div>

        {/* Address Form */}
        <div
          className="bg-card rounded-xl border border-border p-4"
          data-ocid="cart.address.panel"
        >
          <h3 className="font-bold text-sm mb-3">📍 Delivery Address</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="House No / Flat *"
              value={address.flat}
              onChange={(e) =>
                setAddress((p) => ({ ...p, flat: e.target.value }))
              }
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
              data-ocid="cart.input"
            />
            <input
              type="text"
              placeholder="Building / Society Name *"
              value={address.building}
              onChange={(e) =>
                setAddress((p) => ({ ...p, building: e.target.value }))
              }
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
              data-ocid="cart.input"
            />
            <input
              type="text"
              placeholder="🚴 Landmark (most important!)"
              value={address.landmark}
              onChange={(e) =>
                setAddress((p) => ({ ...p, landmark: e.target.value }))
              }
              className="w-full bg-amber/10 border border-amber/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-amber/70 focus:outline-none focus:ring-2 focus:ring-amber/40"
              data-ocid="cart.input"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Area / Sector"
                value={address.area}
                onChange={(e) =>
                  setAddress((p) => ({ ...p, area: e.target.value }))
                }
                className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                data-ocid="cart.input"
              />
              <input
                type="text"
                placeholder="Pincode *"
                value={address.pincode}
                onChange={(e) =>
                  setAddress((p) => ({ ...p, pincode: e.target.value }))
                }
                className="w-28 bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                data-ocid="cart.input"
              />
            </div>
            <div className="flex gap-2">
              {["Home", "Work", "Other"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAddress((p) => ({ ...p, type }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    address.type === type
                      ? "orange-gradient text-white border-transparent"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                  data-ocid="cart.address.toggle"
                >
                  {type === "Home" ? "🏠" : type === "Work" ? "💼" : "📍"}{" "}
                  {type}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSaveAddress}
              className="w-full py-2.5 border-2 border-orange text-orange font-bold rounded-lg text-sm hover:bg-orange/10 transition-colors"
              data-ocid="cart.save_button"
            >
              Save Address
            </button>
          </div>

          {savedAddress && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <DeliveryAddressCard address={savedAddress} />
            </motion.div>
          )}
        </div>

        {/* Login prompt if not logged in */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange/5 border border-orange/30 rounded-xl p-4 flex items-center gap-3"
            data-ocid="cart.login.card"
          >
            <span className="text-2xl">🔐</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                Login required to place order
              </p>
              <p className="text-xs text-muted-foreground">
                Sign in for faster checkout and order tracking
              </p>
            </div>
          </motion.div>
        )}

        {/* Proceed to Pay */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleProceedToPay}
          className="w-full py-4 orange-gradient rounded-2xl text-white font-black text-base shadow-orange flex items-center justify-center gap-2 mb-6"
          data-ocid="cart.submit_button"
        >
          {!isLoggedIn ? (
            <>
              <span>🔐 Login to Proceed</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </>
          ) : (
            <>
              <span>Proceed to Pay ₹{total}</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
