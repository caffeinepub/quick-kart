import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface Product {
    id: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    deliveryTime: string;
    stock: bigint;
    imageUrl: string;
    category: ProductCategory;
    price: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface NewProduct {
    name: string;
    description: string;
    deliveryTime: string;
    stock: bigint;
    imageUrl: string;
    category: ProductCategory;
    price: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UpdateProduct {
    name: string;
    description: string;
    deliveryTime: string;
    stock: bigint;
    imageUrl: string;
    category: ProductCategory;
    price: number;
}
export type PaymentMethod = { __kind__: "cod" } | { __kind__: "upi" };
export type OrderStatus = { __kind__: "pendingVerification" } | { __kind__: "confirmed" } | { __kind__: "delivered" };
export interface Order {
    id: bigint;
    itemsJson: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    address: string;
    customerName: string;
    createdAt: bigint;
}
export interface NewOrder {
    itemsJson: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    address: string;
    customerName: string;
}
export interface DeliveryFeeSettings {
    tier1Fee: number;
    tier2Fee: number;
    tier3Fee: number;
    lastUpdated: bigint;
}
export interface FlashNotifySubscriber {
    principal: Principal;
    name: string;
    phone: string;
    subscribedAt: bigint;
}
export enum ProductCategory {
    food = "food",
    coldDrinks = "coldDrinks",
    grocery = "grocery"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(newProduct: NewProduct): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(id: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProduct(id: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getProductsByCategory(category: ProductCategory): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProduct(id: bigint, update: UpdateProduct): Promise<boolean>;
    placeOrder(newOrder: NewOrder): Promise<bigint>;
    getOrders(): Promise<Array<Order>>;
    confirmPayment(orderId: bigint): Promise<boolean>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<boolean>;
    getDeliveryFeeSettings(): Promise<DeliveryFeeSettings>;
    updateDeliveryFeeSettings(tier1Fee: number, tier2Fee: number, tier3Fee: number): Promise<void>;
    subscribeFlashNotify(name: string, phone: string): Promise<boolean>;
    getFlashNotifySubscribers(): Promise<Array<FlashNotifySubscriber>>;
    clearFlashNotifySubscribers(): Promise<void>;
}
