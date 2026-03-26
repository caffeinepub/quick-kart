export type Category =
  | "food"
  | "beverages"
  | "grocery"
  | "services"
  | "fashion"
  | "cosmetics"
  | "mobiles";

export type FashionGender = "men" | "women" | "kids" | "unisex";

export interface Product {
  id: number;
  name: string;
  category: Category;
  subCategory?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  deliveryTime: string;
  isVeg: boolean;
  badge?: string;
  description: string;
  isService?: boolean;
  gender?: FashionGender;
  ageGroup?: string;
  sizes?: string[];
  brand?: string;
}

export const categoryConfig: Record<
  Category,
  { icon: string; label: string; color: string }
> = {
  food: { icon: "🍔", label: "Food", color: "#FF6B35" },
  beverages: { icon: "🥤", label: "Cold Drinks", color: "#00B4D8" },
  grocery: { icon: "🛒", label: "Grocery", color: "#06D6A0" },
  services: { icon: "🔧", label: "Services", color: "#8338EC" },
  fashion: { icon: "👗", label: "Fashion", color: "#FF006E" },
  cosmetics: { icon: "💄", label: "Cosmetics", color: "#FB5607" },
  mobiles: { icon: "📱", label: "Mobiles", color: "#3A86FF" },
};
