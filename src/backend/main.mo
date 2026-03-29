import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";


actor {
  public type UserProfile = {
    name : Text;
  };

  public type ProductCategory = {
    #food;
    #coldDrinks;
    #grocery;
  };

  public type Product = {
    id : Nat;
    name : Text;
    price : Float;
    imageUrl : Text;
    category : ProductCategory;
    stock : Nat;
    description : Text;
    deliveryTime : Text;
    createdAt : Int;
  };

  public type NewProduct = {
    name : Text;
    price : Float;
    imageUrl : Text;
    category : ProductCategory;
    stock : Nat;
    description : Text;
    deliveryTime : Text;
  };

  public type UpdateProduct = {
    name : Text;
    price : Float;
    imageUrl : Text;
    category : ProductCategory;
    stock : Nat;
    description : Text;
    deliveryTime : Text;
  };

  public type PaymentMethod = {
    #cod;
    #upi;
  };

  public type OrderStatus = {
    #pendingVerification;
    #confirmed;
    #delivered;
  };

  public type Order = {
    id : Nat;
    itemsJson : Text;
    totalAmount : Float;
    paymentMethod : PaymentMethod;
    status : OrderStatus;
    address : Text;
    customerName : Text;
    createdAt : Int;
  };

  public type NewOrder = {
    itemsJson : Text;
    totalAmount : Float;
    paymentMethod : PaymentMethod;
    address : Text;
    customerName : Text;
  };

  public type FlashNotifySubscriber = {
    principal : Principal;
    name : Text;
    phone : Text;
    subscribedAt : Int;
  };

  // Migration: keep old stable var to absorb existing canister data
  var deliveryFeeSettings : {tier1Fee : Float; tier2Fee : Float; tier3Fee : Float; lastUpdated : Int} = {
    tier1Fee = 20.0;
    tier2Fee = 40.0;
    tier3Fee = 60.0;
    lastUpdated = 0;
  };

  // Global delivery fee settings (distance-based tiers) - new type
  public type DeliveryFeeSettings = {
    range1 : Float;   // 0-2 km
    range2 : Float;   // 2-5 km
    range3 : Float;   // 5+ km
    lastUpdated : Int;
  };
  // New delivery config: base fee + optional extra charge
  public type DeliveryConfig = {
    baseDeliveryFee : Float;
    extraCharge : Float;
    lastUpdated : Int;
  };
  // Distance-based delivery settings (4 ranges)
  public type DistanceDeliverySettings = {
    baseDeliveryFee : Float;
    range1Extra : Float;   // 0-2 km extra: default 0
    range2Extra : Float;   // 2-5 km extra: default 10
    range3Extra : Float;   // 5-8 km extra: default 20
    range4Extra : Float;   // 8+ km extra: default 40
    lastUpdated : Int;
  };
  // Radius-based delivery settings (single radius + per-km charge)
  public type RadiusDeliveryConfig = {
    radiusKm : Float;
    baseCharge : Float;
    chargePerKm : Float;
    lastUpdated : Int;
  };




  var nextId = 1;
  let products = Map.empty<Nat, Product>();

  var nextOrderId = 1;
  let orders = Map.empty<Nat, Order>();

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Flash notify subscribers (keyed by principal to deduplicate)
  let flashNotifySubscribers = Map.empty<Principal, FlashNotifySubscriber>();

  // Global delivery fee settings - new type (migrated from deliveryFeeSettings)
  var deliverySettings : DeliveryFeeSettings = {
    range1 = 20.0;
    range2 = 40.0;
    range3 = 60.0;
    lastUpdated = 0;
  };

  // New delivery config state (base + extra)
  var deliveryConfig : DeliveryConfig = {
    baseDeliveryFee = 20.0;
    extraCharge = 0.0;
    lastUpdated = 0;
  };
  // Distance-based delivery settings state
  var distanceDeliverySettings : DistanceDeliverySettings = {
    baseDeliveryFee = 20.0;
    range1Extra = 0.0;
    range2Extra = 10.0;
    range3Extra = 20.0;
    range4Extra = 40.0;
    lastUpdated = 0;
  };
  // Radius-based delivery config state
  var radiusDeliveryConfig : RadiusDeliveryConfig = {
    radiusKm = 10.0;
    baseCharge = 20.0;
    chargePerKm = 5.0;
    lastUpdated = 0;
  };




  // Migration: copy old tier fields to new range fields on upgrade
  system func postupgrade() {
    if (deliveryFeeSettings.lastUpdated > 0) {
      deliverySettings := {
        range1 = deliveryFeeSettings.tier1Fee;
        range2 = deliveryFeeSettings.tier2Fee;
        range3 = deliveryFeeSettings.tier3Fee;
        lastUpdated = deliveryFeeSettings.lastUpdated;
      };
    };
  };

  // Access control setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // File storage
  include MixinStorage();

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // User Profile Queries
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Product CRUD - open to all (PIN auth is handled on the frontend)
  public shared func addProduct(newProduct : NewProduct) : async Nat {
    let id = nextId;
    nextId += 1;

    let product : Product = {
      newProduct with
      id;
      createdAt = Time.now();
    };

    products.add(id, product);
    id;
  };

  public shared func updateProduct(id : Nat, update : UpdateProduct) : async Bool {
    switch (products.get(id)) {
      case (null) { false };
      case (?existingProduct) {
        let updatedProduct = {
          id;
          name = update.name;
          price = update.price;
          imageUrl = update.imageUrl;
          category = update.category;
          stock = update.stock;
          description = update.description;
          deliveryTime = update.deliveryTime;
          createdAt = existingProduct.createdAt;
        };
        products.add(id, updatedProduct);
        true;
      };
    };
  };

  public shared func deleteProduct(id : Nat) : async Bool {
    if (products.containsKey(id)) {
      products.remove(id);
      true;
    } else {
      false;
    };
  };

  // Public product queries.
  public query func getProduct(id : Nat) : async ?Product {
    products.get(id);
  };

  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query func getProductsByCategory(category : ProductCategory) : async [Product] {
    products.values().filter(func(p) { p.category == category }).toArray();
  };

  // Order management - public can place orders
  public shared func placeOrder(newOrder : NewOrder) : async Nat {
    let id = nextOrderId;
    nextOrderId += 1;

    let status : OrderStatus = switch (newOrder.paymentMethod) {
      case (#cod) { #confirmed };
      case (#upi) { #pendingVerification };
    };

    let order : Order = {
      newOrder with
      id;
      status;
      createdAt = Time.now();
    };

    orders.add(id, order);
    id;
  };

  // Get all orders (PIN-protected on frontend)
  public query func getOrders() : async [Order] {
    orders.values().toArray();
  };

  // Confirm UPI payment (PIN-protected on frontend)
  public shared func confirmPayment(orderId : Nat) : async Bool {
    switch (orders.get(orderId)) {
      case (null) { false };
      case (?order) {
        let updated = {
          order with
          status = #confirmed;
        };
        orders.add(orderId, updated);
        true;
      };
    };
  };

  // Update order status (admin use): pendingVerification -> confirmed -> delivered
  public shared func updateOrderStatus(orderId : Nat, newStatus : OrderStatus) : async Bool {
    switch (orders.get(orderId)) {
      case (null) { false };
      case (?order) {
        let updated = {
          order with
          status = newStatus;
        };
        orders.add(orderId, updated);
        true;
      };
    };
  };

  // Flash notify subscriptions
  public shared ({ caller }) func subscribeFlashNotify(name : Text, phone : Text) : async Bool {
    let subscriber : FlashNotifySubscriber = {
      principal = caller;
      name;
      phone;
      subscribedAt = Time.now();
    };
    flashNotifySubscribers.add(caller, subscriber);
    true;
  };

  public query func getFlashNotifySubscribers() : async [FlashNotifySubscriber] {
    flashNotifySubscribers.values().toArray();
  };

  public shared func clearFlashNotifySubscribers() : async () {
    for (key in flashNotifySubscribers.keys().toArray().vals()) {
      flashNotifySubscribers.remove(key);
    };
  };

  // Delivery Fee Settings - global single source of truth
  public query func getDeliveryFeeSettings() : async DeliveryFeeSettings {
    deliverySettings;
  };

  public shared func updateDeliveryFeeSettings(range1 : Float, range2 : Float, range3 : Float) : async () {
    deliverySettings := {
      range1;
      range2;
      range3;
      lastUpdated = Time.now();
    };
  };

  // New DeliveryConfig functions
  public query func getDeliveryConfig() : async DeliveryConfig {
    deliveryConfig;
  };

  public shared func updateDeliveryConfig(baseDeliveryFee : Float, extraCharge : Float) : async () {
    deliveryConfig := {
      baseDeliveryFee;
      extraCharge;
      lastUpdated = Time.now();
    };
  };

  // Distance delivery settings
  public query func getDistanceDeliverySettings() : async DistanceDeliverySettings {
    distanceDeliverySettings;
  };

  public shared func updateDistanceDeliverySettings(baseDeliveryFee : Float, range1Extra : Float, range2Extra : Float, range3Extra : Float, range4Extra : Float) : async () {
    distanceDeliverySettings := {
      baseDeliveryFee;
      range1Extra;
      range2Extra;
      range3Extra;
      range4Extra;
      lastUpdated = Time.now();
    };
  };

  // Radius-based delivery config (new)
  public query func getRadiusDeliveryConfig() : async RadiusDeliveryConfig {
    radiusDeliveryConfig;
  };

  public shared func updateRadiusDeliveryConfig(radiusKm : Float, baseCharge : Float, chargePerKm : Float) : async () {
    radiusDeliveryConfig := {
      radiusKm;
      baseCharge;
      chargePerKm;
      lastUpdated = Time.now();
    };
  };
};