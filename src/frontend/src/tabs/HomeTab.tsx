import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  MapPin,
  Mic,
  Moon,
  Search,
  ShoppingCart,
  Sun,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "../components/ProductCard";
import { createActorWithConfig } from "../config";
import { type Category, categoryConfig } from "../data/products";
import { useProducts } from "../hooks/useProducts";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const DEFAULT_LOCATION = "Delivering to Areas Near Atraulia";
const DEFAULT_BANNER =
  "/assets/generated/atraulia-escooter-banner.dim_800x400.jpg";

interface HomeTabProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onTabChange: (tab: string) => void;
}

export function HomeTab({ isDark, onToggleTheme, onTabChange }: HomeTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const getInitialCountdown = () => {
    const mins = Number.parseInt(
      localStorage.getItem("flashTimerMins") || "15",
      10,
    );
    return Math.max(1, mins) * 60 - 1;
  };
  const [countdown, setCountdown] = useState(getInitialCountdown);
  const [flashEnabled, setFlashEnabled] = useState(
    () => localStorage.getItem("flashEnabled") !== "false",
  );
  const [flashTitle, setFlashTitle] = useState(
    () => localStorage.getItem("flashTitle") || "🔥 FLASH DEALS",
  );
  const [flashMaxProducts, setFlashMaxProducts] = useState(() =>
    Number.parseInt(localStorage.getItem("flashMaxProducts") || "10", 10),
  );
  const [deliveryLocation, setDeliveryLocation] = useState(
    () => localStorage.getItem("deliveryLocation") || DEFAULT_LOCATION,
  );
  const [bannerImageUrl, setBannerImageUrl] = useState(
    () => localStorage.getItem("bannerImageUrl") || DEFAULT_BANNER,
  );
  const { user, isLoggedIn } = useAuthStore();
  const [notifySubscribed, setNotifySubscribed] = useState(
    () => localStorage.getItem("flashNotifySubscribed") === "true",
  );
  const [notifyLoading, setNotifyLoading] = useState(false);
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const { products, loading } = useProducts();

  useEffect(() => {
    const getMins = () =>
      Math.max(
        1,
        Number.parseInt(localStorage.getItem("flashTimerMins") || "15", 10),
      );
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : getMins() * 60 - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => {
      setFlashEnabled(localStorage.getItem("flashEnabled") !== "false");
      setFlashTitle(localStorage.getItem("flashTitle") || "🔥 FLASH DEALS");
      setFlashMaxProducts(
        Number.parseInt(localStorage.getItem("flashMaxProducts") || "10", 10),
      );
      const mins = Math.max(
        1,
        Number.parseInt(localStorage.getItem("flashTimerMins") || "15", 10),
      );
      setCountdown(mins * 60 - 1);
    };
    window.addEventListener("flashSettingsUpdated", handler);
    return () => window.removeEventListener("flashSettingsUpdated", handler);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setDeliveryLocation(
        localStorage.getItem("deliveryLocation") || DEFAULT_LOCATION,
      );
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("deliveryLocationUpdated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("deliveryLocationUpdated", handleStorage);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      setBannerImageUrl(
        localStorage.getItem("bannerImageUrl") || DEFAULT_BANNER,
      );
    };
    window.addEventListener("bannerImageUpdated", handler);
    return () => window.removeEventListener("bannerImageUpdated", handler);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const flashDeals = products
    .filter(
      (p) =>
        p.price < p.originalPrice || products.indexOf(p) < flashMaxProducts,
    )
    .slice(0, flashMaxProducts);
  const trending = products.slice(0, 6);

  const filtered = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null;

  const cartCount = getTotalItems();

  const categories: Category[] = ["food", "beverages", "grocery", "services"];

  const handleNotifyMe = async () => {
    if (!user) return;
    setNotifyLoading(true);
    try {
      const actor = (await createActorWithConfig()) as any;
      await actor.subscribeFlashNotify(user.name, user.phone);
      setNotifySubscribed(true);
      localStorage.setItem("flashNotifySubscribed", "true");
      toast.success("You'll be notified when Flash Deals go live! 🔔");
    } catch {
      toast.error("Failed to subscribe. Try again.");
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-black orange-gradient-text tracking-tight">
              ⚡ QUICK KART
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span>📍 {deliveryLocation}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              data-ocid="home.toggle"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              data-ocid="home.secondary_button"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              onClick={() => onTabChange("cart")}
              className="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              data-ocid="home.cart.link"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange text-white text-xs flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative" data-ocid="home.search_input">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search food, groceries, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted rounded-full py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/50"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-orange"
            data-ocid="home.secondary_button"
          >
            <Mic size={16} />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-5 pt-4">
        {/* Search results */}
        {filtered && (
          <div>
            <h2 className="font-bold text-base mb-3">
              Results for "{searchQuery}" ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-ocid="search.empty_state"
              >
                No results found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!filtered && (
          <>
            {/* Hero Banner */}
            {loading ? (
              <Skeleton className="w-full h-44 rounded-2xl" />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden h-44"
              >
                <img
                  src={bannerImageUrl}
                  alt="Fast delivery"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center pl-5">
                  <span className="text-white text-xl font-black leading-tight">
                    Delivered in
                    <br />
                    <span className="text-amber">10-30 min ⚡</span>
                  </span>
                  <button
                    type="button"
                    className="mt-2 orange-gradient text-white text-xs font-bold px-4 py-2 rounded-full w-fit"
                    onClick={() => onTabChange("categories")}
                    data-ocid="home.primary_button"
                  >
                    Order Now →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Category Scroll */}
            <div>
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Categories
              </h2>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {categories.map((cat) => {
                  const cfg = categoryConfig[cat];
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => onTabChange("categories")}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                      data-ocid={`home.${cat}.tab`}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-card border border-border shadow-card"
                        style={{ boxShadow: `0 4px 16px ${cfg.color}25` }}
                      >
                        {cfg.icon}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flash Deals */}
            {!flashEnabled ? (
              <div
                className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 text-center space-y-2"
                data-ocid="flash.empty_state"
              >
                <div className="text-2xl font-black text-orange-500">
                  ⚡ Flash Deals Coming Soon
                </div>
                <p className="text-sm text-muted-foreground">
                  Stay tuned for exclusive limited-time offers!
                </p>
                {!isLoggedIn ? (
                  <p className="text-xs text-muted-foreground/70 pt-1">
                    Login to get notified when Flash Deals go live
                  </p>
                ) : notifySubscribed ? (
                  <div className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-500 text-sm font-semibold px-3 py-1.5 rounded-full mt-1">
                    ✅ You'll be notified!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleNotifyMe}
                    disabled={notifyLoading}
                    className="mt-1 inline-flex items-center gap-1.5 orange-gradient text-white text-sm font-bold px-4 py-2 rounded-full disabled:opacity-60"
                    data-ocid="flash.notify_button"
                  >
                    {notifyLoading ? "Subscribing..." : "🔔 Notify Me"}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-flash-red">
                      {flashTitle}
                    </span>
                    <div className="flash-gradient text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {formatTime(countdown)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-orange font-semibold"
                    data-ocid="home.secondary_button"
                  >
                    See all →
                  </button>
                </div>

                {loading ? (
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="w-40 h-52 rounded-xl flex-shrink-0"
                      />
                    ))}
                  </div>
                ) : flashDeals.length === 0 ? (
                  <div
                    className="text-center py-8 text-muted-foreground text-sm"
                    data-ocid="flash.empty_state"
                  >
                    No flash deals right now. Check back soon! 🔥
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {flashDeals.map((p) => (
                      <div key={p.id} className="w-40 flex-shrink-0">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trending Near You */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-black">
                  🏙️ Trending Near You
                </span>
                <button
                  type="button"
                  className="text-xs text-orange font-semibold"
                  data-ocid="home.secondary_button"
                >
                  See all →
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-52 rounded-xl" />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="trending.empty_state"
                >
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="font-semibold">No products yet</p>
                  <p className="text-sm mt-1">
                    Products will appear here once added by admin
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {trending.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
