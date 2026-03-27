import { Heart, Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../data/products";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { items, addToCart, updateQuantity, toggleWishlist, isInWishlist } =
    useCartStore();
  const [adding, setAdding] = useState(false);

  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const inWishlist = isInWishlist(product.id);
  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const handleAdd = () => {
    setAdding(true);
    addToCart(product);
    toast.success(`✓ ${product.name} added to cart!`, {
      duration: 1500,
      position: "bottom-center",
    });
    setTimeout(() => setAdding(false), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card rounded-2xl overflow-hidden shadow-md border border-border relative flex flex-col"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}
      data-ocid="product.card"
    >
      {/* Image area */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.background =
                "linear-gradient(135deg, #f97316 0%, #fb923c 100%)";
              parent.innerHTML += `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.5rem">🛍️</div>`;
            }
          }}
        />

        {/* Top-left: discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <span
              className="text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(90deg,#ef4444,#f97316)" }}
            >
              {discount}% OFF
            </span>
          </div>
        )}
        {product.badge && !discount && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange text-white">
              {product.badge}
            </span>
          </div>
        )}

        {/* Top-right: wishlist */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow transition-transform hover:scale-110"
          data-ocid="product.toggle"
        >
          <Heart
            size={14}
            className={
              inWishlist ? "fill-red-500 text-red-500" : "text-gray-500"
            }
          />
        </button>

        {/* Bottom: delivery time pill */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex justify-start">
          <div className="flex items-center gap-1 bg-black/65 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            <Zap size={10} className="text-yellow-400" />
            <span className="font-semibold">{product.deliveryTime}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Veg indicator + name */}
        <div className="flex items-start gap-1.5">
          <span
            className={`mt-0.5 w-3 h-3 rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${
              product.isVeg ? "border-green-500" : "border-red-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.isVeg ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </span>
          <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">
            {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base font-black text-foreground">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs line-through text-muted-foreground">
              ₹{product.originalPrice}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-green-600">
              {discount}% off
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add to Cart */}
        <AnimatePresence mode="wait">
          {qty === 0 ? (
            <motion.button
              key="add"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: adding ? 1.05 : 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={handleAdd}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-transform"
              style={{ background: "linear-gradient(90deg,#f97316,#ef4444)" }}
              data-ocid="product.primary_button"
            >
              <ShoppingCart size={13} />
              Add to Cart
            </motion.button>
          ) : (
            <motion.div
              key="qty"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full mt-1 flex items-center justify-between rounded-xl overflow-hidden"
              style={{ background: "linear-gradient(90deg,#f97316,#ef4444)" }}
            >
              <button
                type="button"
                onClick={() => updateQuantity(product.id, qty - 1)}
                className="flex-1 py-2 flex items-center justify-center text-white"
                data-ocid="product.secondary_button"
              >
                <Minus size={13} strokeWidth={2.5} />
              </button>
              <span className="text-white text-xs font-black w-6 text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(product.id, qty + 1)}
                className="flex-1 py-2 flex items-center justify-center text-white"
                data-ocid="product.primary_button"
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
