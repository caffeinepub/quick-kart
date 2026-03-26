import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { type Category, categoryConfig } from "../data/products";
import { useProducts } from "../hooks/useProducts";

const filters = [
  { id: "all", label: "All" },
  { id: "under100", label: "Under ₹100" },
  { id: "under500", label: "Under ₹500" },
  { id: "express", label: "⚡ Express" },
];

const fashionFilters = [
  { id: "all", label: "All" },
  { id: "men", label: "👔 Men" },
  { id: "women", label: "👗 Women" },
  { id: "kids", label: "👶 Kids (9-14)" },
];

// Categories only supported by backend
const backendCategories: Category[] = ["food", "beverages", "grocery"];
const comingSoonCategories: Category[] = [
  "fashion",
  "cosmetics",
  "mobiles",
  "services",
];

export function CategoriesTab() {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [fashionGender, setFashionGender] = useState("all");
  const { products, loading } = useProducts();

  const allCategories: Array<{
    id: Category | "all";
    icon: string;
    label: string;
  }> = [
    { id: "all", icon: "🏠", label: "All" },
    ...Object.entries(categoryConfig).map(([id, cfg]) => ({
      id: id as Category,
      icon: cfg.icon,
      label: cfg.label,
    })),
  ];

  const isComingSoon = comingSoonCategories.includes(
    activeCategory as Category,
  );
  const isFashionLike = ["fashion", "cosmetics", "mobiles"].includes(
    activeCategory,
  );

  const filtered = products.filter((p) => {
    if (
      activeCategory !== "all" &&
      !backendCategories.includes(activeCategory as Category)
    ) {
      return false;
    }
    const catMatch = activeCategory === "all" || p.category === activeCategory;
    let filterMatch = true;
    if (activeFilter === "under100") filterMatch = p.price < 100;
    if (activeFilter === "under500") filterMatch = p.price < 500;
    if (activeFilter === "express") {
      const mins = Number.parseInt(p.deliveryTime);
      filterMatch = !Number.isNaN(mins) && mins <= 12;
    }
    let genderMatch = true;
    if (activeCategory === "fashion" && fashionGender !== "all") {
      if (fashionGender === "kids")
        genderMatch = (p.ageGroup ?? "").startsWith("9");
      else genderMatch = p.gender === fashionGender;
    }
    return catMatch && filterMatch && genderMatch;
  });

  return (
    <div
      className="flex flex-col min-h-screen pb-20"
      data-ocid="categories.page"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-black orange-gradient-text">
          ⚡ QUICK KART
        </h1>

        {/* Category tiles */}
        <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveFilter("all");
                  setFashionGender("all");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "orange-gradient text-white shadow-orange"
                    : "bg-card border border-border text-foreground"
                }`}
                data-ocid={`categories.${cat.id}.tab`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fashion gender sub-filter */}
        {activeCategory === "fashion" && (
          <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
            {fashionFilters.map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFashionGender(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  fashionGender === f.id
                    ? "bg-pink-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
                data-ocid="categories.gender.filter"
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Price / type Filters */}
        <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
          {filters.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
              data-ocid="categories.filter.tab"
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Fashion/Cosmetics/Mobiles/Services info banner */}
        {isFashionLike && (
          <div className="mb-3 rounded-xl bg-pink-500/10 border border-pink-500/30 px-3 py-2 text-xs text-pink-400 font-medium">
            {activeCategory === "fashion" &&
              "👗 Men, Women & Kids clothing (Ages 9-50). Select size before adding to cart."}
            {activeCategory === "cosmetics" &&
              "💄 Top beauty brands | Next-day delivery"}
            {activeCategory === "mobiles" &&
              "📱 Genuine phones with warranty | Next-day delivery"}
          </div>
        )}

        {/* Coming Soon state for unsupported categories */}
        {isComingSoon ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground"
            data-ocid="categories.empty_state"
          >
            <div className="text-5xl mb-4">
              {categoryConfig[activeCategory as Category]?.icon ?? "🔜"}
            </div>
            <p className="font-bold text-lg text-foreground">Coming Soon!</p>
            <p className="text-sm mt-2 max-w-xs mx-auto">
              {activeCategory === "fashion" &&
                "Fashion products are coming to Quick Kart very soon. Stay tuned!"}
              {activeCategory === "cosmetics" &&
                "Beauty & cosmetics section is on the way!"}
              {activeCategory === "mobiles" &&
                "Mobiles & electronics coming soon!"}
              {activeCategory === "services" &&
                "Local services section is under development!"}
            </p>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {filtered.length} items found
            </p>

            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-muted-foreground"
                data-ocid="categories.empty_state"
              >
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold">No items found</p>
                <p className="text-sm mt-1">
                  Try a different filter or check back later
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
