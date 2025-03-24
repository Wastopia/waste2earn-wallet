import DB "db";
import Types "types";
import Documents "documents";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat32 "mo:base/Nat32";
import Bool "mo:base/Bool";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Float "mo:base/Float";
import StableTypes "stable_types";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";

actor WalletDatabase {
  type DbInit<T, PK> = Types.DbInit<T, PK>;
  type DbUse<T, PK> = Types.DbUse<T, PK>;
  type RXMDB<T> = Types.RXMDB<T>;
  type StableStorage = StableTypes.StableStorage;
  type StableRXMDB<T> = StableTypes.StableRXMDB<T>;
  type StableDbInit<T, PK> = StableTypes.StableDbInit<T, PK>;

  type BankDetails = {
    bpi : ?{ accountName : Text; accountNumber : Text };
    gcash : ?Text;
    paymaya : ?Text;
  };

  type PaymentMethodDetails = {
    accountName : ?Text;
    accountNumber : ?Text;
    bankName : ?Text;
    walletAddress : ?Text;
  };

  type PaymentMethod = {
    details : PaymentMethodDetails;
    id : Text;
    methodType : Text;
    name : Text;
  };

  type OrderDocument = {
    amount : Float;
    createdAt : Int;
    deleted : Bool;
    escrowId : ?Text;
    expiresAt : Int;
    id : Text;
    paymentMethod : PaymentMethod;
    price : Float;
    sellerId : Text;
    status : Text;
    updatedAt : Nat32;
  };

  type PaymentVerificationDocument = {
    deleted : Bool;
    orderId : Text;
    proof : ?Text;
    status : Text;
    updatedAt : Nat32;
    verifiedAt : ?Int;
    verifiedBy : ?Text;
  };

  type KYCDocument = {
    address : {
      city : Text;
      country : Text;
      postalCode : Text;
      state : Text;
      street : Text;
    };
    bankDetails : ?BankDetails;
    deleted : Bool;
    documents : [{
      expiryDate : Text;
      fileUrl : Text;
      number : Text;
      type_ : Text;
      verificationStatus : Text;
    }];
    personalInfo : {
      dateOfBirth : Text;
      email : Text;
      firstName : Text;
      lastName : Text;
      nationality : Text;
      phoneNumber : Text;
    };
    riskLevel : Text;
    status : Text;
    updatedAt : Nat32;
    userId : Text;
    verificationDetails : ?{
      remarks : ?Text;
      submittedAt : Int;
      verifiedAt : ?Int;
      verifiedBy : ?Text;
    };
  };

  type ValidatorDocument = {
    avatarUrl : ?Text;
    deleted : Bool;
    id : Text;
    isActive : Bool;
    name : Text;
    rating : Float;
    responseTime : Text;
    totalOrders : Nat;
    updatedAt : Nat32;
  };

  type AssetDocument_v0 = {
    sortIndex : Nat32;
    updatedAt : Nat32;
    deleted : Bool;
    address : Text;
    symbol : Text;
    name : Text;
    tokenName : Text;
    tokenSymbol : Text;
    decimal : Text;
    shortDecimal : Text;
    subAccounts : [{
      name : Text;
      sub_account_id : Text;
      address : Text;
      amount : Text;
      currency_amount : Text;
      transaction_fee : Text;
      decimal : Nat32;
      symbol : Text;
    }];
    index : Text;
    logo : Text;
    supportedStandards : [Text];
  };

  type ContactDocument_v0 = {
    name : Text;
    principal : Text;
    accountIdentifier : Text;
    accounts : [{
      name : Text;
      subaccount : Text;
      subaccountId : Text;
      tokenSymbol : Text;
    }];
    updatedAt : Nat32;
    deleted : Bool;
  };

  type AllowanceDocument_v0 = {
    asset : {
      logo : Text;
      name : Text;
      symbol : Text;
      address : Text;
      decimal : Text;
      tokenName : Text;
      tokenSymbol : Text;
      supportedStandards : [Text];
    };
    id : Text;
    subAccountId : Text;
    spender : Text;
    updatedAt : Nat32;
    deleted : Bool;
  };

  type ServiceDocument_v0 = {
    name : Text;
    principal : Text;
    assets : [{
      tokenSymbol : Text;
      logo : Text;
      tokenName : Text;
      decimal : Text;
      shortDecimal : Text;
      principal : Text;
    }];
    updatedAt : Nat32;
    deleted : Bool;
  };

  type AssetDocument = AssetDocument_v0;
  type ContactDocument = ContactDocument_v0;
  type AllowanceDocument = AllowanceDocument_v0;
  type ServiceDocument = ServiceDocument_v0;

  stable var storage_v0 : [(Principal, StableStorage)] = [];

  var databasesCache : HashMap.HashMap<Principal, (
    Types.DbUse<Documents.AssetDocument, Text>,
    Types.DbUse<Documents.ContactDocument, Text>,
    Types.DbUse<Documents.AllowanceDocument, Text>,
    Types.DbUse<Documents.ServiceDocument, Text>,
    Types.DbUse<Documents.OrderDocument, Text>,
    Types.DbUse<Documents.PaymentVerificationDocument, Text>,
    Types.DbUse<Documents.KYCDocument, Text>,
    Types.DbUse<Documents.ValidatorDocument, Text>
  )> = HashMap.HashMap(0, Principal.equal, Principal.hash);

  private func getDatabase(owner : Principal, notFoundStrategy : { #create; #returnNull }) : ?(
    Types.DbUse<Documents.AssetDocument, Text>,
    Types.DbUse<Documents.ContactDocument, Text>,
    Types.DbUse<Documents.AllowanceDocument, Text>,
    Types.DbUse<Documents.ServiceDocument, Text>,
    Types.DbUse<Documents.OrderDocument, Text>,
    Types.DbUse<Documents.PaymentVerificationDocument, Text>,
    Types.DbUse<Documents.KYCDocument, Text>,
    Types.DbUse<Documents.ValidatorDocument, Text>
  ) {
    switch (databasesCache.get(owner)) {
      case (?db) ?db;
      case (null) {
        let stableStore = switch (Array.find<(Principal, StableStorage)>(storage_v0, func((p, _)) = Principal.equal(p, owner))) {
          case (?found) found.1;
          case (null) {
            switch (notFoundStrategy) {
              case (#returnNull) return null;
              case (#create) {
                // Create empty stable storage with arrays
                let emptyStable = {
                  principals = [owner];
                  assets = [];
                  contacts = [];
                  allowances = [];
                  services = [];
                  orders = [];
                  paymentVerifications = [];
                  kyc = [];
                  validators = [];
                };
                
                // Use Buffer for efficient array manipulation
                let buf = Buffer.Buffer<(Principal, StableStorage)>(storage_v0.size() + 1);
                for (entry in storage_v0.vals()) {
                  buf.add(entry);
                };
                buf.add((owner, emptyStable));
                storage_v0 := Buffer.toArray(buf);
                
                emptyStable;
              };
            };
          };
        };
        
        // Initialize DB objects
        let assetDb = DB.empty<Documents.AssetDocument, Text>(Text.equal, Text.hash);
        let contactDb = DB.empty<Documents.ContactDocument, Text>(Text.equal, Text.hash);
        let allowanceDb = DB.empty<Documents.AllowanceDocument, Text>(Text.equal, Text.hash);
        let serviceDb = DB.empty<Documents.ServiceDocument, Text>(Text.equal, Text.hash);
        let orderDb = DB.empty<Documents.OrderDocument, Text>(Text.equal, Text.hash);
        let paymentDb = DB.empty<Documents.PaymentVerificationDocument, Text>(Text.equal, Text.hash);
        let kycDb = DB.empty<Documents.KYCDocument, Text>(Text.equal, Text.hash);
        let validatorDb = DB.empty<Documents.ValidatorDocument, Text>(Text.equal, Text.hash);
        
        // Load data from stable storage if it exists
        for ((doc, key) in Iter.fromArray<(Documents.AssetDocument, Text)>(stableStore.assets)) {
          assetDb.db.vec.add(doc);
          assetDb.pk_store.put(key, assetDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.ContactDocument, Text)>(stableStore.contacts)) {
          contactDb.db.vec.add(doc);
          contactDb.pk_store.put(key, contactDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.AllowanceDocument, Text)>(stableStore.allowances)) {
          allowanceDb.db.vec.add(doc);
          allowanceDb.pk_store.put(key, allowanceDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.ServiceDocument, Text)>(stableStore.services)) {
          serviceDb.db.vec.add(doc);
          serviceDb.pk_store.put(key, serviceDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.OrderDocument, Text)>(stableStore.orders)) {
          orderDb.db.vec.add(doc);
          orderDb.pk_store.put(key, orderDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.PaymentVerificationDocument, Text)>(stableStore.paymentVerifications)) {
          paymentDb.db.vec.add(doc);
          paymentDb.pk_store.put(key, paymentDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.KYCDocument, Text)>(stableStore.kyc)) {
          kycDb.db.vec.add(doc);
          kycDb.pk_store.put(key, kycDb.db.vec.size() - 1);
        };
        
        for ((doc, key) in Iter.fromArray<(Documents.ValidatorDocument, Text)>(stableStore.validators)) {
          validatorDb.db.vec.add(doc);
          validatorDb.pk_store.put(key, validatorDb.db.vec.size() - 1);
        };
        
        let db = (
          DB.use<Documents.AssetDocument, Text>(assetDb, func(x) = x.address, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.ContactDocument, Text>(contactDb, func(x) = x.principal, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.AllowanceDocument, Text>(allowanceDb, func(x) = x.id, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.ServiceDocument, Text>(serviceDb, func(x) = x.principal, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.OrderDocument, Text>(orderDb, func(x) = x.id, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.PaymentVerificationDocument, Text>(paymentDb, func(x) = x.orderId, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.KYCDocument, Text>(kycDb, func(x) = x.userId, Text.compare, func(x) = x.updatedAt),
          DB.use<Documents.ValidatorDocument, Text>(validatorDb, func(x) = x.id, Text.compare, func(x) = x.updatedAt)
        );
        databasesCache.put(owner, db);
        ?db;
      };
    };
  };

  public shared ({ caller }) func pushAssets(docs : [Documents.AssetDocument]) : async [Documents.AssetDocument] {
    let ?(tdb, _, _, _, _, _, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(tdb, docs);
  };

  public shared ({ caller }) func pushContacts(docs : [Documents.ContactDocument]) : async [Documents.ContactDocument] {
    let ?(_, cdb, _, _, _, _, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(cdb, docs);
  };

  public shared ({ caller }) func pushAllowances(docs : [Documents.AllowanceDocument]) : async [Documents.AllowanceDocument] {
    let ?(_, _, adb, _, _, _, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(adb, docs);
  };

  public shared ({ caller }) func pushServices(docs : [Documents.ServiceDocument]) : async [Documents.ServiceDocument] {
    let ?(_, _, _, sdb, _, _, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(sdb, docs);
  };

  public shared ({ caller }) func pushOrders(docs : [Documents.OrderDocument]) : async [Documents.OrderDocument] {
    let ?(_, _, _, _, odb, _, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(odb, docs);
  };

  public shared ({ caller }) func pushPaymentVerifications(docs : [Documents.PaymentVerificationDocument]) : async [Documents.PaymentVerificationDocument] {
    let ?(_, _, _, _, _, pdb, _, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(pdb, docs);
  };

  public shared ({ caller }) func pushKYCDetails(docs : [Documents.KYCDocument]) : async [Documents.KYCDocument] {
    let ?(_, _, _, _, _, _, kdb, _) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(kdb, docs);
  };

  public shared ({ caller }) func pushValidators(docs : [Documents.ValidatorDocument]) : async [Documents.ValidatorDocument] {
    let ?(_, _, _, _, _, _, _, vdb) = getDatabase(caller, #create) else Debug.trap("Can never happen");
    DB.pushUpdates(vdb, docs);
  };

  public shared query ({ caller }) func pullAssets(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.AssetDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(tdb, _, _, _, _, _, _, _)) DB.getLatest(tdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullContacts(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.ContactDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, cdb, _, _, _, _, _, _)) DB.getLatest(cdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullAllowances(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.AllowanceDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, adb, _, _, _, _, _)) DB.getLatest(adb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullServices(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.ServiceDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, sdb, _, _, _, _)) DB.getLatest(sdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullOrders(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) DB.getLatest(odb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullPaymentVerifications(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.PaymentVerificationDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, pdb, _, _)) DB.getLatest(pdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullKYCDetails(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.KYCDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) DB.getLatest(kdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func pullValidators(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.ValidatorDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) DB.getLatest(vdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query func dump() : async [(Principal, ([Documents.AssetDocument], [Documents.ContactDocument], [Documents.AllowanceDocument], [Documents.ServiceDocument], [Documents.OrderDocument], [Documents.PaymentVerificationDocument], [Documents.KYCDocument], [Documents.ValidatorDocument]))] {
    Array.map<(Principal, StableStorage), (Principal, ([Documents.AssetDocument], [Documents.ContactDocument], [Documents.AllowanceDocument], [Documents.ServiceDocument], [Documents.OrderDocument], [Documents.PaymentVerificationDocument], [Documents.KYCDocument], [Documents.ValidatorDocument]))>(
      storage_v0,
      func((p, store)) = (
        p,
        (
          Array.map<(Documents.AssetDocument, Text), Documents.AssetDocument>(store.assets, func((doc, _)) = doc),
          Array.map<(Documents.ContactDocument, Text), Documents.ContactDocument>(store.contacts, func((doc, _)) = doc),
          Array.map<(Documents.AllowanceDocument, Text), Documents.AllowanceDocument>(store.allowances, func((doc, _)) = doc),
          Array.map<(Documents.ServiceDocument, Text), Documents.ServiceDocument>(store.services, func((doc, _)) = doc),
          Array.map<(Documents.OrderDocument, Text), Documents.OrderDocument>(store.orders, func((doc, _)) = doc),
          Array.map<(Documents.PaymentVerificationDocument, Text), Documents.PaymentVerificationDocument>(store.paymentVerifications, func((doc, _)) = doc),
          Array.map<(Documents.KYCDocument, Text), Documents.KYCDocument>(store.kyc, func((doc, _)) = doc),
          Array.map<(Documents.ValidatorDocument, Text), Documents.ValidatorDocument>(store.validators, func((doc, _)) = doc)
        )
      )
    );
  };

  public shared query ({ caller }) func doesStorageExist() : async Bool {
    switch (databasesCache.get(caller)) {
      case (?_) true;
      case (null) false;
    };
  };

  // Helper methods for P2P operations
  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : Text) : async Result.Result<Documents.OrderDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        DB.updateOrderStatus(odb, orderId, newStatus, func(order : Documents.OrderDocument) : Documents.OrderDocument = {
          order with status = newStatus;
          updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  public shared ({ caller }) func getOrderById(orderId : Text) : async ?Documents.OrderDocument {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) DB.getById(odb, orderId);
      case (null) null;
    };
  };

  public shared ({ caller }) func getOrdersByStatus(status : Text) : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        DB.getByStatus(odb, status, func(order : Documents.OrderDocument) : Text = order.status);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func getActiveOrders() : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        DB.getActive(odb, func(order : Documents.OrderDocument) : Bool = order.deleted);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func getOrdersByDateRange(startTime : Int, endTime : Int) : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        DB.getByDateRange(odb, startTime, endTime, func(order : Documents.OrderDocument) : Int = order.createdAt);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func getOrdersByUser(userId : Text) : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        let orders = DB.getActive(odb, func(order : Documents.OrderDocument) : Bool = order.deleted);
        Array.filter<Documents.OrderDocument>(orders, func(order) = order.sellerId == userId);
      };
      case (null) [];
    };
  };

  // Helper methods for KYC operations
  public shared ({ caller }) func updateKYCStatus(
    userId : Text, 
    newStatus : Text, 
    verifier : Text, 
    remarks : ?Text
  ) : async Result.Result<Documents.KYCDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) {
        DB.updateKYCStatus(kdb, userId, newStatus, verifier, remarks, func(kyc : Documents.KYCDocument) : Documents.KYCDocument = {
          kyc with 
            status = newStatus;
            verificationDetails = ?{
              submittedAt = Time.now();
              verifiedAt = ?Time.now();
              verifiedBy = ?verifier;
              remarks = remarks;
            };
            updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  public shared ({ caller }) func getKYCByRiskLevel(riskLevel : Text) : async [Documents.KYCDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) {
        let kycs = DB.getActive(kdb, func(kyc : Documents.KYCDocument) : Bool = kyc.deleted);
        Array.filter<Documents.KYCDocument>(kycs, func(kyc) = kyc.riskLevel == riskLevel);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func getKYCByStatus(status : Text) : async [Documents.KYCDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) {
        DB.getByStatus(kdb, status, func(kyc : Documents.KYCDocument) : Text = kyc.status);
      };
      case (null) [];
    };
  };

  // Helper methods for Validator operations
  public shared ({ caller }) func updateValidatorStatus(
    validatorId : Text, 
    isActive : Bool
  ) : async Result.Result<Documents.ValidatorDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        DB.updateValidatorStatus(vdb, validatorId, isActive, func(validator : Documents.ValidatorDocument) : Documents.ValidatorDocument = {
          validator with 
            isActive = isActive;
            updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  public shared ({ caller }) func getActiveValidators() : async [Documents.ValidatorDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        DB.getActive(vdb, func(validator : Documents.ValidatorDocument) : Bool = validator.deleted);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func getValidatorsByRating(minRating : Float) : async [Documents.ValidatorDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        let validators = DB.getActive(vdb, func(validator : Documents.ValidatorDocument) : Bool = validator.deleted);
        Array.filter<Documents.ValidatorDocument>(validators, func(validator) = validator.rating >= minRating);
      };
      case (null) [];
    };
  };

  public shared ({ caller }) func updateValidatorRating(validatorId : Text, newRating : Float) : async Result.Result<Documents.ValidatorDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        DB.updateValidatorStatus(vdb, validatorId, true, func(validator : Documents.ValidatorDocument) : Documents.ValidatorDocument = {
          validator with 
            rating = newRating;
            updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  public shared ({ caller }) func updateValidatorResponseTime(validatorId : Text, responseTime : Text) : async Result.Result<Documents.ValidatorDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        DB.updateValidatorStatus(vdb, validatorId, true, func(validator : Documents.ValidatorDocument) : Documents.ValidatorDocument = {
          validator with 
            responseTime = responseTime;
            updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  public shared ({ caller }) func incrementValidatorOrders(validatorId : Text) : async Result.Result<Documents.ValidatorDocument, Text> {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        DB.updateValidatorStatus(vdb, validatorId, true, func(validator : Documents.ValidatorDocument) : Documents.ValidatorDocument = {
          validator with 
            totalOrders = validator.totalOrders + 1;
            updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
        });
      };
      case (null) #err("Database not found");
    };
  };

  // Additional query methods for P2P operations
  public shared query ({ caller }) func getLatestOrders(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.OrderDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) DB.getLatest(odb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  public shared query ({ caller }) func getLatestPaymentVerifications(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.PaymentVerificationDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, pdb, _, _)) DB.getLatest(pdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  // Additional query methods for KYC operations
  public shared query ({ caller }) func getLatestKYCDetails(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.KYCDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) DB.getLatest(kdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  // Additional query methods for Validator operations
  public shared query ({ caller }) func getLatestValidators(updatedAt : Nat32, lastId : ?Text, limit : Nat) : async [Documents.ValidatorDocument] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) DB.getLatest(vdb, updatedAt, lastId, limit);
      case (null) [];
    };
  };

  // Batch operations for P2P
  public shared ({ caller }) func batchUpdateOrderStatus(orderIds : [Text], newStatus : Text) : async [Result.Result<Documents.OrderDocument, Text>] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        Array.map<Text, Result.Result<Documents.OrderDocument, Text>>(
          orderIds,
          func(orderId) = DB.updateOrderStatus(
            odb,
            orderId,
            newStatus,
            func(order : Documents.OrderDocument) : Documents.OrderDocument = {
              order with 
                status = newStatus;
                updatedAt = Nat32.fromNat(Int.abs(Time.now() / 1_000_000_000));
            }
          )
        );
      };
      case (null) Array.map<Text, Result.Result<Documents.OrderDocument, Text>>(orderIds, func(_) = #err("Database not found"));
    };
  };

  // Statistics for P2P operations
  public shared query ({ caller }) func getOrderStatistics() : async {
    totalOrders : Nat;
    activeOrders : Nat;
    completedOrders : Nat;
    disputedOrders : Nat;
  } {
    let result = switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, odb, _, _, _)) {
        let orders = DB.getActive(odb, func(order : Documents.OrderDocument) : Bool { order.deleted });
        {
          totalOrders = orders.size();
          activeOrders = Array.filter<Documents.OrderDocument>(orders, func(o) { o.status == "open" or o.status == "payment_pending" }).size();
          completedOrders = Array.filter<Documents.OrderDocument>(orders, func(o) { o.status == "completed" }).size();
          disputedOrders = Array.filter<Documents.OrderDocument>(orders, func(o) { o.status == "disputed" }).size();
        }
      };
      case (null) {
        {
          totalOrders = 0;
          activeOrders = 0;
          completedOrders = 0;
          disputedOrders = 0;
        }
      };
    };
    result
  };

  // KYC Statistics
  public shared query ({ caller }) func getKYCStatistics() : async {
    totalUsers : Nat;
    pendingVerifications : Nat;
    approvedUsers : Nat;
    rejectedUsers : Nat;
    highRiskUsers : Nat;
  } {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) {
        let kycs = DB.getActive(kdb, func(kyc : Documents.KYCDocument) : Bool { kyc.deleted });
        {
          totalUsers = kycs.size();
          pendingVerifications = Array.filter<Documents.KYCDocument>(kycs, func(k) { k.status == "pending" }).size();
          approvedUsers = Array.filter<Documents.KYCDocument>(kycs, func(k) { k.status == "approved" }).size();
          rejectedUsers = Array.filter<Documents.KYCDocument>(kycs, func(k) { k.status == "rejected" }).size();
          highRiskUsers = Array.filter<Documents.KYCDocument>(kycs, func(k) { k.riskLevel == "high" }).size();
        }
      };
      case (null) {
        {
          totalUsers = 0;
          pendingVerifications = 0;
          approvedUsers = 0;
          rejectedUsers = 0;
          highRiskUsers = 0;
        }
      };
    };
  };

  // Validator Statistics
  public shared query ({ caller }) func getValidatorStatistics() : async {
    totalValidators : Nat;
    activeValidators : Nat;
    averageRating : Float;
    totalOrdersProcessed : Nat;
  } {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, _, vdb)) {
        let validators = DB.getActive(vdb, func(validator : Documents.ValidatorDocument) : Bool { validator.deleted });
        let activeVals = Array.filter<Documents.ValidatorDocument>(validators, func(v) { v.isActive });
        let totalRating = Array.foldLeft<Documents.ValidatorDocument, Float>(
          validators,
          0.0,
          func(acc, v) { acc + v.rating }
        );
        let totalOrders = Array.foldLeft<Documents.ValidatorDocument, Nat>(
          validators,
          0,
          func(acc, v) { acc + v.totalOrders }
        );
        {
          totalValidators = validators.size();
          activeValidators = activeVals.size();
          averageRating = if (validators.size() > 0) { totalRating / Float.fromInt(validators.size()) } else { 0.0 };
          totalOrdersProcessed = totalOrders;
        }
      };
      case (null) {
        {
          totalValidators = 0;
          activeValidators = 0;
          averageRating = 0.0;
          totalOrdersProcessed = 0;
        }
      };
    };
  };

  // Add User type definition
  type User = {
    userId: Text;
    firstName: Text;
    lastName: Text;
    email: Text;
    phoneNumber: Text;
    status: Text;
    riskLevel: Text;
    createdAt: Int;
    updatedAt: Nat32;
  };

  // Add getAllUsers query function
  public shared query ({ caller }) func getAllUsers() : async [User] {
    switch (getDatabase(caller, #returnNull)) {
      case (?(_, _, _, _, _, _, kdb, _)) {
        let kycs = DB.getActive(kdb, func(kyc : Documents.KYCDocument) : Bool = not kyc.deleted);
        Array.map<Documents.KYCDocument, User>(
          kycs,
          func(kyc) = {
            userId = kyc.userId;
            firstName = kyc.personalInfo.firstName;
            lastName = kyc.personalInfo.lastName;
            email = kyc.personalInfo.email;
            phoneNumber = kyc.personalInfo.phoneNumber;
            status = kyc.status;
            riskLevel = kyc.riskLevel;
            createdAt = switch (kyc.verificationDetails) {
              case (?vd) vd.submittedAt;
              case (null) 0;
            };
            updatedAt = kyc.updatedAt;
          }
        );
      };
      case (null) [];
    };
  };
};
