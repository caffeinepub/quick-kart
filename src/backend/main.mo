
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

  var nextId = 1;
  let products = Map.empty<Nat, Product>();

  var nextOrderId = 1;
  let orders = Map.empty<Nat, Order>();

  let userProfiles = Map.empty<Principal, UserProfile>();

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
};
