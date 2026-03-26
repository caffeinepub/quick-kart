import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { AdminTab } from "./tabs/AdminTab";
import { CartTab } from "./tabs/CartTab";
import { CategoriesTab } from "./tabs/CategoriesTab";
import { HomeTab } from "./tabs/HomeTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { ProfileTab } from "./tabs/ProfileTab";

type Tab = "home" | "categories" | "orders" | "cart" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isDark, setIsDark] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

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
        return <CartTab />;
      case "profile":
        return (
          <ProfileTab
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onAdminPanel={() => setShowAdmin(true)}
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

      {!showAdmin && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      <Toaster richColors position="bottom-center" />
    </div>
  );
}
