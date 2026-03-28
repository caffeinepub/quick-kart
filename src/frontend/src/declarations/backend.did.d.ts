/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface NewProduct {
  'name' : string,
  'description' : string,
  'deliveryTime' : string,
  'stock' : bigint,
  'imageUrl' : string,
  'category' : ProductCategory,
  'price' : number,
}
export interface Product {
  'id' : bigint,
  'name' : string,
  'createdAt' : bigint,
  'description' : string,
  'deliveryTime' : string,
  'stock' : bigint,
  'imageUrl' : string,
  'category' : ProductCategory,
  'price' : number,
}
export type ProductCategory = { 'food' : null } |
  { 'coldDrinks' : null } |
  { 'grocery' : null };
export interface ShoppingItem {
  'productName' : string,
  'currency' : string,
  'quantity' : bigint,
  'priceInCents' : bigint,
  'productDescription' : string,
}
export interface StripeConfiguration {
  'allowedCountries' : Array<string>,
  'secretKey' : string,
}
export type StripeSessionStatus = {
    'completed' : { 'userPrincipal' : [] | [string], 'response' : string }
  } |
  { 'failed' : { 'error' : string } };
export interface TransformationInput {
  'context' : Uint8Array,
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array,
  'headers' : Array<http_header>,
}
export interface UpdateProduct {
  'name' : string,
  'description' : string,
  'deliveryTime' : string,
  'stock' : bigint,
  'imageUrl' : string,
  'category' : ProductCategory,
  'price' : number,
}
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _CaffeineStorageCreateCertificateResult {
  'method' : string,
  'blob_hash' : string,
}
export interface _CaffeineStorageRefillInformation {
  'proposed_top_up_amount' : [] | [bigint],
}
export interface _CaffeineStorageRefillResult {
  'success' : [] | [boolean],
  'topped_up_amount' : [] | [bigint],
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array,
  'headers' : Array<http_header>,
}
export type PaymentMethod = { 'cod' : null } | { 'upi' : null };
export type OrderStatus = { 'pendingVerification' : null } | { 'confirmed' : null } | { 'delivered' : null };
export interface NewOrder {
  'itemsJson' : string,
  'totalAmount' : number,
  'paymentMethod' : PaymentMethod,
  'address' : string,
  'customerName' : string,
}
export interface Order {
  'id' : bigint,
  'itemsJson' : string,
  'totalAmount' : number,
  'paymentMethod' : PaymentMethod,
  'status' : OrderStatus,
  'address' : string,
  'customerName' : string,
  'createdAt' : bigint,
}
export interface FlashNotifySubscriber {
  'principal' : Principal,
  'name' : string,
  'phone' : string,
  'subscribedAt' : bigint,
}
export interface _SERVICE {
  '_caffeineStorageBlobIsLive' : ActorMethod<[Uint8Array], boolean>,
  '_caffeineStorageBlobsToDelete' : ActorMethod<[], Array<Uint8Array>>,
  '_caffeineStorageConfirmBlobDeletion' : ActorMethod<
    [Array<Uint8Array>],
    undefined
  >,
  '_caffeineStorageCreateCertificate' : ActorMethod<
    [string],
    _CaffeineStorageCreateCertificateResult
  >,
  '_caffeineStorageRefillCashier' : ActorMethod<
    [[] | [_CaffeineStorageRefillInformation]],
    _CaffeineStorageRefillResult
  >,
  '_caffeineStorageUpdateGatewayPrincipals' : ActorMethod<[], undefined>,
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'addProduct' : ActorMethod<[NewProduct], bigint>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'createCheckoutSession' : ActorMethod<
    [Array<ShoppingItem>, string, string],
    string
  >,
  'deleteProduct' : ActorMethod<[bigint], boolean>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getProduct' : ActorMethod<[bigint], [] | [Product]>,
  'getProducts' : ActorMethod<[], Array<Product>>,
  'getProductsByCategory' : ActorMethod<[ProductCategory], Array<Product>>,
  'getStripeSessionStatus' : ActorMethod<[string], StripeSessionStatus>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isStripeConfigured' : ActorMethod<[], boolean>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setStripeConfiguration' : ActorMethod<[StripeConfiguration], undefined>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
  'updateProduct' : ActorMethod<[bigint, UpdateProduct], boolean>,
  'placeOrder' : ActorMethod<[NewOrder], bigint>,
  'getOrders' : ActorMethod<[], Array<Order>>,
  'confirmPayment' : ActorMethod<[bigint], boolean>,
  'updateOrderStatus' : ActorMethod<[bigint, OrderStatus], boolean>,
  'subscribeFlashNotify' : ActorMethod<[string, string], boolean>,
  'getFlashNotifySubscribers' : ActorMethod<[], Array<FlashNotifySubscriber>>,
  'clearFlashNotifySubscribers' : ActorMethod<[], undefined>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
