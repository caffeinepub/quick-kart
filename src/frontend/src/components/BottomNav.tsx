import { ClipboardList, Grid3x3, Home, ShoppingCart, User } from "lucide-react";
import { motion } from "motion/react";
import { useCartStore } from "../store/cartStore";
import { useOrderNotificationStore } from "../store/orderNotificationStore";

type Tab = "home" | "categories" | "orders" | "cart" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: "home" as Tab, label: "Home", icon: Home },
  { id: "categories" as Tab, label: "Categories", icon: Grid3x3 },
  { id: "orders" as Tab, label: "Orders", icon: ClipboardList },
  { id: "cart" as Tab, label: "Cart", icon: ShoppingCart },
  { id: "profile" as Tab, label: "Profile", icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const cartCount = getTotalItems();
  const getNewOrderCount = useOrderNotificationStore((s) => s.getNewOrderCount);
  const newOrderCount = getNewOrderCount();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border bottom-nav-safe"
      style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }}
      data-ocid="nav.panel"
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 relative"
              data-ocid={`nav.${tab.id}.link`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={isActive ? "text-orange" : "text-muted-foreground"}
                />
                {tab.id === "cart" && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange text-white text-xs flex items-center justify-center font-bold"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
                {tab.id === "orders" && newOrderCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                  >
                    {newOrderCount > 9 ? "9+" : newOrderCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-orange" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
