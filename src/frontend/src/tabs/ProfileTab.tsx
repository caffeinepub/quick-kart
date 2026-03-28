import {
  Bike,
  ChevronRight,
  CreditCard,
  Gift,
  Globe,
  Heart,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { QRCodeCard } from "../components/QRCodeCard";
import type { AuthUser } from "../store/authStore";

interface ProfileTabProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onAdminPanel: () => void;
  onDeliveryPanel: () => void;
  user: AuthUser | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onLogout: () => void;
}

const menuItems = [
  { icon: ShoppingBag, label: "My Orders", badge: null },
  { icon: Heart, label: "Wishlist", badge: null },
  { icon: MapPin, label: "Saved Addresses", badge: null },
  { icon: CreditCard, label: "Payment Methods", badge: null },
  { icon: Gift, label: "Refer & Earn", badge: "₹50", highlight: true },
  { icon: Star, label: "Loyalty Points", badge: "120 pts", highlight: true },
  { icon: HelpCircle, label: "Help & Support", badge: null },
  { icon: Info, label: "About Quick Kart", badge: null },
];

export function ProfileTab({
  isDark,
  onToggleTheme,
  onAdminPanel,
  onDeliveryPanel,
  user,
  isLoggedIn,
  onLoginRequired,
  onLogout,
}: ProfileTabProps) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="flex flex-col min-h-screen pb-20" data-ocid="profile.page">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-black orange-gradient-text">
          ⚡ QUICK KART
        </h1>
        <p className="text-xs text-muted-foreground">My Profile</p>
      </header>

      <div className="px-4 pt-5 space-y-4">
        {/* Auth Card */}
        {isLoggedIn && user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4"
            data-ocid="profile.card"
          >
            <div className="w-16 h-16 rounded-full orange-gradient flex items-center justify-center">
              <span className="text-2xl font-black text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-foreground truncate">
                {user.name}
              </div>
              <div className="text-sm text-muted-foreground">{user.phone}</div>
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="fill-amber text-amber" />
                <span className="text-xs font-semibold text-amber">
                  Quick Kart Member
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5 text-center"
            data-ocid="profile.card"
          >
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <User size={30} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-base text-foreground">
              Sign in to Quick Kart
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Track orders, save addresses, and more
            </p>
            <button
              type="button"
              onClick={onLoginRequired}
              className="w-full py-3 orange-gradient text-white font-black rounded-xl shadow-orange flex items-center justify-center gap-2"
              data-ocid="profile.login.primary_button"
            >
              <LogIn size={16} /> Login / Sign Up
            </button>
          </motion.div>
        )}

        {/* Saved Address (logged in) */}
        {isLoggedIn && user?.address && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-4"
            data-ocid="profile.address.card"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-orange" />
              <span className="text-sm font-bold">Saved Address</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange font-semibold">
                {user.address.type}
              </span>
            </div>
            <p className="text-sm text-foreground font-semibold">
              {user.address.flat}, {user.address.building}
            </p>
            {user.address.landmark && (
              <p className="text-xs text-amber font-semibold mt-0.5">
                🚴 Near {user.address.landmark}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.address.area} - {user.address.pincode}
            </p>
          </motion.div>
        )}

        {/* Order History (logged in) */}
        {isLoggedIn && user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
            data-ocid="profile.orders.panel"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Package size={14} className="text-orange" />
              <span className="text-sm font-bold">Order History</span>
            </div>
            {user.orderIds.length === 0 ? (
              <div
                className="px-4 py-5 text-center"
                data-ocid="profile.orders.empty_state"
              >
                <p className="text-sm text-muted-foreground">
                  No orders yet. Start shopping!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {user.orderIds.map((id, i) => (
                  <div
                    key={id}
                    className="px-4 py-3 flex items-center justify-between"
                    data-ocid={`profile.orders.item.${i + 1}`}
                  >
                    <div>
                      <span className="text-sm font-semibold">Order #{id}</span>
                    </div>
                    <span className="text-xs font-bold text-green-500">
                      ✓ Placed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Menu Items */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={!isLoggedIn ? onLoginRequired : undefined}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                data-ocid="profile.menu.button"
              >
                <Icon
                  size={18}
                  className={
                    item.highlight ? "text-orange" : "text-muted-foreground"
                  }
                />
                <span className="flex-1 text-sm font-medium text-left text-foreground">
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.highlight
                        ? "bg-orange/20 text-orange"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={14} className="text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        {/* Admin Panel Button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={onAdminPanel}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-2xl border border-orange/30 hover:bg-orange/5 transition-colors"
          data-ocid="profile.admin.open_modal_button"
        >
          <Settings size={18} className="text-orange" />
          <span className="flex-1 text-sm font-bold text-left text-orange">
            ⚙️ Admin Panel
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange/20 text-orange">
            Founder
          </span>
          <ChevronRight size={14} className="text-orange" />
        </motion.button>

        {/* Delivery Agent Button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          onClick={onDeliveryPanel}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-2xl border border-blue-500/30 hover:bg-blue-500/5 transition-colors"
          data-ocid="profile.delivery.open_modal_button"
        >
          <Bike size={18} className="text-blue-500" />
          <span className="flex-1 text-sm font-bold text-left text-blue-500">
            🛵 Delivery Agent Login
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
            Agent
          </span>
          <ChevronRight size={14} className="text-blue-500" />
        </motion.button>

        {/* Theme Toggle */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon size={16} className="text-muted-foreground" />
              ) : (
                <Sun size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Theme</span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDark ? "bg-orange" : "bg-muted"
              }`}
              data-ocid="profile.theme.toggle"
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Language</span>
            </div>
            <div className="flex rounded-full border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  lang === "en"
                    ? "orange-gradient text-white"
                    : "text-muted-foreground"
                }`}
                data-ocid="profile.lang.toggle"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  lang === "hi"
                    ? "orange-gradient text-white"
                    : "text-muted-foreground"
                }`}
                data-ocid="profile.lang.toggle"
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* My QR Code */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">🎟️ My QR Code</span>
            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className="text-xs text-orange font-semibold"
              data-ocid="profile.qr.open_modal_button"
            >
              {showQR ? "Hide" : "Show"}
            </button>
          </div>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <QRCodeCard
                data={`QUICKKART|USER|${user?.name ?? "Guest"}|LOYALTY:0`}
                title={user?.name ?? "Guest User"}
                subtitle="Quick Kart Member"
              />
            </motion.div>
          )}
          {!showQR && (
            <p className="text-xs text-muted-foreground">
              Show at partner store for exclusive discounts and loyalty points
            </p>
          )}
        </div>

        {/* Logout */}
        {isLoggedIn && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl hover:bg-destructive/20 transition-colors font-bold text-sm"
            data-ocid="profile.logout.button"
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange font-semibold"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
