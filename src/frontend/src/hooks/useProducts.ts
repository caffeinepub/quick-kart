import { useCallback, useEffect, useState } from "react";
import { ProductCategory } from "../backend";
import type { Product as BackendProduct } from "../backend";
import { createActorWithConfig } from "../config";
import type { Product } from "../data/products";

function mapCategory(cat: ProductCategory): Product["category"] {
  if (cat === ProductCategory.coldDrinks) return "beverages";
  if (cat === ProductCategory.grocery) return "grocery";
  return "food";
}

function mapBackendProduct(p: BackendProduct): Product {
  return {
    id: Number(p.id),
    name: p.name,
    category: mapCategory(p.category),
    price: p.price,
    originalPrice: p.price,
    rating: 4.5,
    reviews: 0,
    image: p.imageUrl,
    deliveryTime: p.deliveryTime,
    isVeg: true,
    description: p.description,
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const actor = await createActorWithConfig();
      const raw = await actor.getProducts();
      setProducts(raw.map(mapBackendProduct));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
