import { Heart, Minus, Plus, Star, Zap } from "lucide-react";
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
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  );

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
      className="bg-card rounded-xl overflow-hidden shadow-card card-hover border border-border relative"
      data-ocid="product.card"
    >
      {/* Wishlist button */}
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center transition-transform hover:scale-110"
        data-ocid="product.toggle"
      >
        <Heart
          size={15}
          className={
            inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }
        />
      </button>

      {/* Badge */}
      {product.badge && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange text-white">
            {product.badge}
          </span>
        </div>
      )}

      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 mt-0">
          {!product.badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-flash-red text-white">
              {discount}% OFF
            </span>
          )}
        </div>
      )}

      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Delivery time badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
          <Zap size={10} className="text-amber" />
          <span>{product.deliveryTime}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Veg / Non-veg indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
              product.isVeg ? "border-green-500" : "border-red-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.isVeg ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </span>
          <span className="text-xs text-muted-foreground">
            {product.isVeg ? "Veg" : "Non-veg"}
          </span>
        </div>

        <h3 className="font-semibold text-sm text-foreground truncate">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Star size={11} className="fill-amber text-amber" />
          <span className="text-xs font-semibold text-foreground">
            {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-foreground">₹{product.price}</span>
            <span className="text-xs line-through text-muted-foreground">
              ₹{product.originalPrice}
            </span>
          </div>

          {/* Add / Qty controls */}
          <AnimatePresence mode="wait">
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.9 }}
                animate={{ scale: adding ? 1.12 : 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={handleAdd}
                className="w-8 h-8 rounded-full orange-gradient text-white flex items-center justify-center shadow-orange"
                data-ocid="product.primary_button"
              >
                <Plus size={16} strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.div
                key="qty"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center gap-1.5 orange-gradient rounded-full px-1"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, qty - 1)}
                  className="w-6 h-6 flex items-center justify-center text-white"
                  data-ocid="product.secondary_button"
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className="text-white text-xs font-bold w-4 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, qty + 1)}
                  className="w-6 h-6 flex items-center justify-center text-white"
                  data-ocid="product.primary_button"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
