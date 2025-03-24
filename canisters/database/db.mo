import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Types "types";
import List "mo:base/List";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Hash "mo:base/Hash";

module {
  public type DbInit<T, PK> = Types.DbInit<T, PK>;
  public type DbUse<T, PK> = Types.DbUse<T, PK>;
  public type RXMDB<T> = Types.RXMDB<T>;

  public func empty<T, PK>(pkEqual : (PK, PK) -> Bool, pkHash : PK -> Hash.Hash) : DbInit<T, PK> {
    {
      db = {
        var reuse_queue = List.nil<Nat>();
        vec = Buffer.Buffer<T>(0);
      };
      pk_store = HashMap.HashMap<PK, Nat>(0, pkEqual, pkHash);
      updated_store = HashMap.HashMap<Nat64, Nat>(0, Nat64.equal, func(n : Nat64) : Hash.Hash { 
        // Use bitwise operations for safer hash
        Nat32.fromNat(Nat64.toNat(n & 0xFFFFFFFF));
      });
    }
  };

  public func use<T, PK>(
    init : DbInit<T, PK>,
    pk_of : T -> PK,
    pk_cmp : (PK, PK) -> { #less; #equal; #greater },
    updated_of : T -> Nat32
  ) : DbUse<T, PK> {
    {
      db = init.db;
      pk_store = init.pk_store;
      updated_store = init.updated_store;
      pk_of = pk_of;
      pk_cmp = pk_cmp;
      updated_of = updated_of;
    }
  };

  public func pushUpdates<T, PK>(use : DbUse<T, PK>, docs : [T]) : [T] {
    for (doc in docs.vals()) {
      let pk = use.pk_of(doc);
      let idx = use.db.vec.size();
      use.db.vec.add(doc);
      use.pk_store.put(pk, idx);
      use.updated_store.put(Nat64.fromNat(idx), idx);
    };
    docs
  };

  public func getLatest<T, PK>(
    use : DbUse<T, PK>,
    _updatedAt : Nat32,
    lastId : ?PK,
    limit : Nat,
  ) : [T] {
    let results = Buffer.Buffer<T>(limit);
    let start = switch (lastId) {
      case (?id) {
        switch (use.pk_store.get(id)) {
          case (?idx) idx;
          case (null) Debug.trap("ID not found");
        };
      };
      case (null) 0;
    };
    
    var count = 0;
    var current = start;
    while (count < limit) {
      switch (use.updated_store.get(Nat64.fromNat(current))) {
        case (?docIdx) {
          switch (use.db.vec.getOpt(docIdx)) {
            case (?doc) {
              results.add(doc);
              count += 1;
            };
            case (null) ();
          };
        };
        case (null) ();
      };
      current += 1;
    };
    
    Buffer.toArray(results)
  };

  public func getById<T>(use : DbUse<T, Text>, id : Text) : ?T {
    switch (use.pk_store.get(id)) {
      case (?idx) use.db.vec.getOpt(idx);
      case (null) null;
    }
  };

  public func getByIds<T>(use : DbUse<T, Text>, ids : [Text]) : [T] {
    Array.mapFilter<Text, T>(ids, func(id) = getById(use, id));
  };

  public func deleteDocument<T>(use : DbUse<T, Text>, id : Text) : Result.Result<(), Text> {
    switch (use.pk_store.get(id)) {
      case (null) #err("Document not found");
      case (?_idx) {
        use.pk_store.delete(id);
        #ok();
      };
    }
  };

  public func getActive<T>(use : DbUse<T, Text>, isActive : T -> Bool) : [T] {
    let results = Buffer.Buffer<T>(0);
    for ((_, idx) in use.pk_store.entries()) {
      switch (use.db.vec.getOpt(idx)) {
        case (?doc) {
          if (isActive(doc)) {
            results.add(doc);
          };
        };
        case (null) ();
      };
    };
    Buffer.toArray(results)
  };

  public func getByDateRange<T>(use : DbUse<T, Text>, start : Int, end : Int, getDate : T -> Int) : [T] {
    let results = Buffer.Buffer<T>(0);
    for ((_, idx) in use.pk_store.entries()) {
      switch (use.db.vec.getOpt(idx)) {
        case (?doc) {
          let date = getDate(doc);
          if (date >= start and date <= end) {
            results.add(doc);
          };
        };
        case (null) ();
      };
    };
    Buffer.toArray(results)
  };

  public func getByStatus<T>(use : DbUse<T, Text>, status : Text, getStatus : T -> Text) : [T] {
    let results = Buffer.Buffer<T>(0);
    for ((_, idx) in use.pk_store.entries()) {
      switch (use.db.vec.getOpt(idx)) {
        case (?doc) {
          if (getStatus(doc) == status) {
            results.add(doc);
          };
        };
        case (null) ();
      };
    };
    Buffer.toArray(results)
  };

  public func updateOrderStatus<T>(
    use : DbUse<T, Text>,
    orderId : Text,
    _status : Text,
    updateOrder : T -> T,
  ) : Result.Result<T, Text> {
    switch (use.pk_store.get(orderId)) {
      case (null) #err("Order not found");
      case (?idx) {
        switch (use.db.vec.getOpt(idx)) {
          case (?order) {
            let updatedOrder = updateOrder(order);
            use.db.vec.put(idx, updatedOrder);
            #ok(updatedOrder);
          };
          case (null) #err("Order data corrupted");
        };
      };
    }
  };

  public func updateKYCStatus<T>(
    use : DbUse<T, Text>,
    userId : Text,
    _status : Text,
    _reason : Text,
    _note : ?Text,
    updateKYC : T -> T,
  ) : Result.Result<T, Text> {
    switch (use.pk_store.get(userId)) {
      case (null) #err("KYC record not found");
      case (?idx) {
        switch (use.db.vec.getOpt(idx)) {
          case (?kyc) {
            let updatedKYC = updateKYC(kyc);
            use.db.vec.put(idx, updatedKYC);
            #ok(updatedKYC);
          };
          case (null) #err("KYC data corrupted");
        };
      };
    }
  };

  public func updateValidatorStatus<T>(
    use : DbUse<T, Text>,
    validatorId : Text,
    _active : Bool,
    updateValidator : T -> T,
  ) : Result.Result<T, Text> {
    switch (use.pk_store.get(validatorId)) {
      case (null) #err("Validator not found");
      case (?idx) {
        switch (use.db.vec.getOpt(idx)) {
          case (?validator) {
            let updatedValidator = updateValidator(validator);
            use.db.vec.put(idx, updatedValidator);
            #ok(updatedValidator);
          };
          case (null) #err("Validator data corrupted");
        };
      };
    }
  };
}
