import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { LoginScreen } from "./screens/LoginScreen";
import { useAuthStore } from "./store/authStore";
import { useOrderNotificationStore } from "./store/orderNotificationStore";
import { AdminTab } from "./tabs/AdminTab";
import { CartTab } from "./tabs/CartTab";
import { CategoriesTab } from "./tabs/CategoriesTab";
import { DeliveryAgentPanel } from "./tabs/DeliveryAgentPanel";
import { HomeTab } from "./tabs/HomeTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { ProfileTab } from "./tabs/ProfileTab";

type Tab = "home" | "categories" | "orders" | "cart" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isDark, setIsDark] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const loginCallbackRef = useRef<(() => void) | null>(null);

  const { isLoggedIn, user, logout } = useAuthStore();

  useEffect(() => {
    const stored = localStorage.getItem("quickkart-theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("quickkart-theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLoginRequired = (callback?: () => void) => {
    loginCallbackRef.current = callback ?? null;
    setShowLoginScreen(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginScreen(false);
    loginCallbackRef.current?.();
    loginCallbackRef.current = null;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onTabChange={(t) => setActiveTab(t as Tab)}
          />
        );
      case "categories":
        return <CategoriesTab />;
      case "orders":
        return <OrdersTab />;
      case "cart":
        return <CartTab onLoginRequired={() => handleLoginRequired()} />;
      case "profile":
        return (
          <ProfileTab
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onAdminPanel={() => setShowAdmin(true)}
            onDeliveryPanel={() => setShowDelivery(true)}
            user={user}
            isLoggedIn={isLoggedIn}
            onLoginRequired={() => handleLoginRequired()}
            onLogout={logout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        {showAdmin ? (
          <motion.div
            key="admin"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background max-w-lg mx-auto overflow-y-auto"
          >
            <AdminTab onBack={() => setShowAdmin(false)} />
          </motion.div>
        ) : showDelivery ? (
          <motion.div
            key="delivery"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background max-w-lg mx-auto overflow-y-auto"
          >
            <DeliveryAgentPanel onBack={() => setShowDelivery(false)} />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {renderTab()}
          </motion.div>
        )}
      </AnimatePresence>

      {!showAdmin && !showDelivery && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "orders") {
              useOrderNotificationStore.getState().markOrdersSeen();
            }
          }}
        />
      )}

      <AnimatePresence>
        {showLoginScreen && (
          <LoginScreen
            onSuccess={handleLoginSuccess}
            allowClose={true}
            onClose={() => setShowLoginScreen(false)}
          />
        )}
      </AnimatePresence>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
