/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const _CaffeineStorageCreateCertificateResult = IDL.Record({
  'method' : IDL.Text,
  'blob_hash' : IDL.Text,
});
export const _CaffeineStorageRefillInformation = IDL.Record({
  'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
});
export const _CaffeineStorageRefillResult = IDL.Record({
  'success' : IDL.Opt(IDL.Bool),
  'topped_up_amount' : IDL.Opt(IDL.Nat),
});
export const ProductCategory = IDL.Variant({
  'food' : IDL.Null,
  'coldDrinks' : IDL.Null,
  'grocery' : IDL.Null,
});
export const NewProduct = IDL.Record({
  'name' : IDL.Text,
  'description' : IDL.Text,
  'deliveryTime' : IDL.Text,
  'stock' : IDL.Nat,
  'imageUrl' : IDL.Text,
  'category' : ProductCategory,
  'price' : IDL.Float64,
});
export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const ShoppingItem = IDL.Record({
  'productName' : IDL.Text,
  'currency' : IDL.Text,
  'quantity' : IDL.Nat,
  'priceInCents' : IDL.Nat,
  'productDescription' : IDL.Text,
});
export const UserProfile = IDL.Record({ 'name' : IDL.Text });
export const Product = IDL.Record({
  'id' : IDL.Nat,
  'name' : IDL.Text,
  'createdAt' : IDL.Int,
  'description' : IDL.Text,
  'deliveryTime' : IDL.Text,
  'stock' : IDL.Nat,
  'imageUrl' : IDL.Text,
  'category' : ProductCategory,
  'price' : IDL.Float64,
});
export const StripeSessionStatus = IDL.Variant({
  'completed' : IDL.Record({
    'userPrincipal' : IDL.Opt(IDL.Text),
    'response' : IDL.Text,
  }),
  'failed' : IDL.Record({ 'error' : IDL.Text }),
});
export const StripeConfiguration = IDL.Record({
  'allowedCountries' : IDL.Vec(IDL.Text),
  'secretKey' : IDL.Text,
});
export const http_header = IDL.Record({
  'value' : IDL.Text,
  'name' : IDL.Text,
});
export const http_request_result = IDL.Record({
  'status' : IDL.Nat,
  'body' : IDL.Vec(IDL.Nat8),
  'headers' : IDL.Vec(http_header),
});
export const TransformationInput = IDL.Record({
  'context' : IDL.Vec(IDL.Nat8),
  'response' : http_request_result,
});
export const TransformationOutput = IDL.Record({
  'status' : IDL.Nat,
  'body' : IDL.Vec(IDL.Nat8),
  'headers' : IDL.Vec(http_header),
});
export const UpdateProduct = IDL.Record({
  'name' : IDL.Text,
  'description' : IDL.Text,
  'deliveryTime' : IDL.Text,
  'stock' : IDL.Nat,
  'imageUrl' : IDL.Text,
  'category' : ProductCategory,
  'price' : IDL.Float64,
});
export const PaymentMethod = IDL.Variant({
  'cod' : IDL.Null,
  'upi' : IDL.Null,
});
export const OrderStatus = IDL.Variant({
  'pendingVerification' : IDL.Null,
  'confirmed' : IDL.Null,
  'delivered' : IDL.Null,
  'outForDelivery' : IDL.Null,
  'cancelled' : IDL.Null,
});
export const NewOrder = IDL.Record({
  'itemsJson' : IDL.Text,
  'totalAmount' : IDL.Float64,
  'paymentMethod' : PaymentMethod,
  'address' : IDL.Text,
  'customerName' : IDL.Text,
});
export const Order = IDL.Record({
  'id' : IDL.Nat,
  'itemsJson' : IDL.Text,
  'totalAmount' : IDL.Float64,
  'paymentMethod' : PaymentMethod,
  'status' : OrderStatus,
  'address' : IDL.Text,
  'customerName' : IDL.Text,
  'createdAt' : IDL.Int,
});
export const FlashNotifySubscriber = IDL.Record({
  'principal' : IDL.Principal,
  'name' : IDL.Text,
  'phone' : IDL.Text,
  'subscribedAt' : IDL.Int,
});
export const DeliveryFeeSettings = IDL.Record({
  'tier1Fee' : IDL.Float64,
  'tier2Fee' : IDL.Float64,
  'tier3Fee' : IDL.Float64,
  'lastUpdated' : IDL.Int,
});

export const idlService = IDL.Service({
  '_caffeineStorageBlobIsLive' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
  '_caffeineStorageBlobsToDelete' : IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Nat8))], ['query']),
  '_caffeineStorageConfirmBlobDeletion' : IDL.Func([IDL.Vec(IDL.Vec(IDL.Nat8))], [], []),
  '_caffeineStorageCreateCertificate' : IDL.Func([IDL.Text], [_CaffeineStorageCreateCertificateResult], []),
  '_caffeineStorageRefillCashier' : IDL.Func([IDL.Opt(_CaffeineStorageRefillInformation)], [_CaffeineStorageRefillResult], []),
  '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'addProduct' : IDL.Func([NewProduct], [IDL.Nat], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'createCheckoutSession' : IDL.Func([IDL.Vec(ShoppingItem), IDL.Text, IDL.Text], [IDL.Text], []),
  'deleteProduct' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getProduct' : IDL.Func([IDL.Nat], [IDL.Opt(Product)], ['query']),
  'getProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
  'getProductsByCategory' : IDL.Func([ProductCategory], [IDL.Vec(Product)], ['query']),
  'getStripeSessionStatus' : IDL.Func([IDL.Text], [StripeSessionStatus], []),
  'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'isStripeConfigured' : IDL.Func([], [IDL.Bool], ['query']),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'setStripeConfiguration' : IDL.Func([StripeConfiguration], [], []),
  'transform' : IDL.Func([TransformationInput], [TransformationOutput], ['query']),
  'updateProduct' : IDL.Func([IDL.Nat, UpdateProduct], [IDL.Bool], []),
  'placeOrder' : IDL.Func([NewOrder], [IDL.Nat], []),
  'getOrders' : IDL.Func([], [IDL.Vec(Order)], ['query']),
  'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  'updateOrderStatus' : IDL.Func([IDL.Nat, OrderStatus], [IDL.Bool], []),
  'subscribeFlashNotify' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
  'getFlashNotifySubscribers' : IDL.Func([], [IDL.Vec(FlashNotifySubscriber)], ['query']),
  'clearFlashNotifySubscribers' : IDL.Func([], [], []),
  'getDeliveryFeeSettings' : IDL.Func([], [DeliveryFeeSettings], ['query']),
  'updateDeliveryFeeSettings' : IDL.Func([IDL.Float64, IDL.Float64, IDL.Float64], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const _CaffeineStorageCreateCertificateResult = IDL.Record({ 'method' : IDL.Text, 'blob_hash' : IDL.Text });
  const _CaffeineStorageRefillInformation = IDL.Record({ 'proposed_top_up_amount' : IDL.Opt(IDL.Nat) });
  const _CaffeineStorageRefillResult = IDL.Record({ 'success' : IDL.Opt(IDL.Bool), 'topped_up_amount' : IDL.Opt(IDL.Nat) });
  const ProductCategory = IDL.Variant({ 'food' : IDL.Null, 'coldDrinks' : IDL.Null, 'grocery' : IDL.Null });
  const NewProduct = IDL.Record({
    'name' : IDL.Text, 'description' : IDL.Text, 'deliveryTime' : IDL.Text,
    'stock' : IDL.Nat, 'imageUrl' : IDL.Text, 'category' : ProductCategory, 'price' : IDL.Float64,
  });
  const UserRole = IDL.Variant({ 'admin' : IDL.Null, 'user' : IDL.Null, 'guest' : IDL.Null });
  const ShoppingItem = IDL.Record({
    'productName' : IDL.Text, 'currency' : IDL.Text, 'quantity' : IDL.Nat,
    'priceInCents' : IDL.Nat, 'productDescription' : IDL.Text,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const Product = IDL.Record({
    'id' : IDL.Nat, 'name' : IDL.Text, 'createdAt' : IDL.Int, 'description' : IDL.Text,
    'deliveryTime' : IDL.Text, 'stock' : IDL.Nat, 'imageUrl' : IDL.Text,
    'category' : ProductCategory, 'price' : IDL.Float64,
  });
  const StripeSessionStatus = IDL.Variant({
    'completed' : IDL.Record({ 'userPrincipal' : IDL.Opt(IDL.Text), 'response' : IDL.Text }),
    'failed' : IDL.Record({ 'error' : IDL.Text }),
  });
  const StripeConfiguration = IDL.Record({ 'allowedCountries' : IDL.Vec(IDL.Text), 'secretKey' : IDL.Text });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({ 'status' : IDL.Nat, 'body' : IDL.Vec(IDL.Nat8), 'headers' : IDL.Vec(http_header) });
  const TransformationInput = IDL.Record({ 'context' : IDL.Vec(IDL.Nat8), 'response' : http_request_result });
  const TransformationOutput = IDL.Record({ 'status' : IDL.Nat, 'body' : IDL.Vec(IDL.Nat8), 'headers' : IDL.Vec(http_header) });
  const UpdateProduct = IDL.Record({
    'name' : IDL.Text, 'description' : IDL.Text, 'deliveryTime' : IDL.Text,
    'stock' : IDL.Nat, 'imageUrl' : IDL.Text, 'category' : ProductCategory, 'price' : IDL.Float64,
  });
  const PaymentMethod = IDL.Variant({ 'cod' : IDL.Null, 'upi' : IDL.Null });
  const OrderStatus = IDL.Variant({
    'pendingVerification' : IDL.Null, 'confirmed' : IDL.Null,
    'delivered' : IDL.Null, 'outForDelivery' : IDL.Null, 'cancelled' : IDL.Null,
  });
  const NewOrder = IDL.Record({
    'itemsJson' : IDL.Text, 'totalAmount' : IDL.Float64, 'paymentMethod' : PaymentMethod,
    'address' : IDL.Text, 'customerName' : IDL.Text,
  });
  const Order = IDL.Record({
    'id' : IDL.Nat, 'itemsJson' : IDL.Text, 'totalAmount' : IDL.Float64,
    'paymentMethod' : PaymentMethod, 'status' : OrderStatus, 'address' : IDL.Text,
    'customerName' : IDL.Text, 'createdAt' : IDL.Int,
  });
  const FlashNotifySubscriber = IDL.Record({
    'principal' : IDL.Principal, 'name' : IDL.Text, 'phone' : IDL.Text, 'subscribedAt' : IDL.Int,
  });
  const DeliveryFeeSettings = IDL.Record({
    'tier1Fee' : IDL.Float64, 'tier2Fee' : IDL.Float64, 'tier3Fee' : IDL.Float64, 'lastUpdated' : IDL.Int,
  });

  return IDL.Service({
    '_caffeineStorageBlobIsLive' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
    '_caffeineStorageBlobsToDelete' : IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Nat8))], ['query']),
    '_caffeineStorageConfirmBlobDeletion' : IDL.Func([IDL.Vec(IDL.Vec(IDL.Nat8))], [], []),
    '_caffeineStorageCreateCertificate' : IDL.Func([IDL.Text], [_CaffeineStorageCreateCertificateResult], []),
    '_caffeineStorageRefillCashier' : IDL.Func([IDL.Opt(_CaffeineStorageRefillInformation)], [_CaffeineStorageRefillResult], []),
    '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'addProduct' : IDL.Func([NewProduct], [IDL.Nat], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'createCheckoutSession' : IDL.Func([IDL.Vec(ShoppingItem), IDL.Text, IDL.Text], [IDL.Text], []),
    'deleteProduct' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getProduct' : IDL.Func([IDL.Nat], [IDL.Opt(Product)], ['query']),
    'getProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
    'getProductsByCategory' : IDL.Func([ProductCategory], [IDL.Vec(Product)], ['query']),
    'getStripeSessionStatus' : IDL.Func([IDL.Text], [StripeSessionStatus], []),
    'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'isStripeConfigured' : IDL.Func([], [IDL.Bool], ['query']),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setStripeConfiguration' : IDL.Func([StripeConfiguration], [], []),
    'transform' : IDL.Func([TransformationInput], [TransformationOutput], ['query']),
    'updateProduct' : IDL.Func([IDL.Nat, UpdateProduct], [IDL.Bool], []),
    'placeOrder' : IDL.Func([NewOrder], [IDL.Nat], []),
    'getOrders' : IDL.Func([], [IDL.Vec(Order)], ['query']),
    'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'updateOrderStatus' : IDL.Func([IDL.Nat, OrderStatus], [IDL.Bool], []),
    'subscribeFlashNotify' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'getFlashNotifySubscribers' : IDL.Func([], [IDL.Vec(FlashNotifySubscriber)], ['query']),
    'clearFlashNotifySubscribers' : IDL.Func([], [], []),
    'getDeliveryFeeSettings' : IDL.Func([], [DeliveryFeeSettings], ['query']),
    'updateDeliveryFeeSettings' : IDL.Func([IDL.Float64, IDL.Float64, IDL.Float64], [], []),
  });
};

export const init = ({ IDL }) => { return []; };
