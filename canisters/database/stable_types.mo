import Documents "documents";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";

module {
  // Stable version of RXMDB
  public type StableRXMDB<T> = {
    reuse_queue : [Nat];
    vec : [?T];
  };

  // Stable version of DbInit
  public type StableDbInit<T, PK> = {
    db : StableRXMDB<T>;
    pk_store : [(PK, Nat)];
    updated_store : [(Nat64, Nat)];
  };

  public type StableStorage = {
    principals : [Principal];
    assets : [(Documents.AssetDocument, Text)];
    contacts : [(Documents.ContactDocument, Text)];
    allowances : [(Documents.AllowanceDocument, Text)];
    services : [(Documents.ServiceDocument, Text)];
    orders : [(Documents.OrderDocument, Text)];
    paymentVerifications : [(Documents.PaymentVerificationDocument, Text)];
    kyc : [(Documents.KYCDocument, Text)];
    validators : [(Documents.ValidatorDocument, Text)];
  };
} 