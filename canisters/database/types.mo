import RXMDB "lib";
import IDX "index";
import PK "primarykey";
import List "mo:base/List";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Nat64 "mo:base/Nat64";

module {
  public type RXMDB<T> = {
    var reuse_queue : List.List<Nat>;
    vec : Buffer.Buffer<T>;
  };

  public type PKInit<T> = PK.Init<T>;
  public type IdxInit<T> = IDX.Init<T>;
  public type RxUse<T> = RXMDB.Use<T>;
  public type PKUse<PK, T> = PK.Use<PK, T>;
  public type IdxUse<K, T> = IDX.Use<K, T>;

  public type DbInit<T, PK> = {
    db : RXMDB<T>;
    pk_store : HashMap.HashMap<PK, Nat>;
    updated_store : HashMap.HashMap<Nat64, Nat>;
  };

  public type DbUse<T, PK> = {
    db : RXMDB<T>;
    pk_store : HashMap.HashMap<PK, Nat>;
    updated_store : HashMap.HashMap<Nat64, Nat>;
    pk_of : T -> PK;
    pk_cmp : (PK, PK) -> { #less; #equal; #greater };
    updated_of : T -> Nat32;
  };
} 