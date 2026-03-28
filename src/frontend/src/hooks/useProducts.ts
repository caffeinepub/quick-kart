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

// Module-level cache shared across all hook instances
let cachedProducts: Product[] | null = null;
let cacheTimestamp = 0;
let inflightPromise: Promise<Product[]> | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

async function fetchProductsFromBackend(): Promise<Product[]> {
  const now = Date.now();
  // Return cache if still fresh
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProducts;
  }
  // Deduplicate concurrent calls
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const actor = await createActorWithConfig();
    const raw = await actor.getProducts();
    const mapped = raw.map(mapBackendProduct);
    cachedProducts = mapped;
    cacheTimestamp = Date.now();
    return mapped;
  })().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}

export function invalidateProductCache() {
  cachedProducts = null;
  cacheTimestamp = 0;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (force = false) => {
    if (force) invalidateProductCache();
    // If we already have fresh cache, use it immediately without showing loader
    const now = Date.now();
    if (!force && cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductsFromBackend();
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: () => fetchProducts(true) };
}
