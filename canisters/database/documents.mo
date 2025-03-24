module {
  public type PaymentMethodDetails = {
    accountNumber : ?Text;
    accountName : ?Text;
    bankName : ?Text;
    walletAddress : ?Text;
  };

  public type PaymentMethod = {
    id : Text;
    name : Text;
    methodType : Text; // "bank" | "gcash" | "maya" | "coins.ph"
    details : PaymentMethodDetails;
  };

  public type OrderDocument = {
    id : Text;
    sellerId : Text;
    amount : Float;
    price : Float;
    status : Text;
    createdAt : Int; // Timestamp
    expiresAt : Int; // Timestamp
    paymentMethod : PaymentMethod;
    escrowId : ?Text;
    updatedAt : Nat32;
    deleted : Bool;
  };

  public type PaymentVerificationDocument = {
    orderId : Text;
    status : Text; // "pending" | "verified" | "rejected"
    proof : ?Text;
    verifiedAt : ?Int; // Timestamp
    verifiedBy : ?Text;
    updatedAt : Nat32;
    deleted : Bool;
  };

  public type BankDetails = {
    gcash : ?Text;
    paymaya : ?Text;
    bpi : ?{
      accountNumber : Text;
      accountName : Text;
    };
  };

  public type KYCDocument = {
    userId : Text;
    status : Text; // "pending" | "approved" | "rejected"
    personalInfo : {
      firstName : Text;
      lastName : Text;
      dateOfBirth : Text;
      nationality : Text;
      phoneNumber : Text;
      email : Text;
    };
    address : {
      street : Text;
      city : Text;
      state : Text;
      country : Text;
      postalCode : Text;
    };
    documents : [{
      type_ : Text;
      number : Text;
      expiryDate : Text;
      fileUrl : Text;
      verificationStatus : Text;
    }];
    verificationDetails : ?{
      submittedAt : Int;
      verifiedAt : ?Int;
      verifiedBy : ?Text;
      remarks : ?Text;
    };
    riskLevel : Text; // "low" | "medium" | "high"
    bankDetails : ?BankDetails;
    updatedAt : Nat32;
    deleted : Bool;
  };

  public type ValidatorDocument = {
    id : Text;
    name : Text;
    isActive : Bool;
    rating : Float;
    responseTime : Text;
    totalOrders : Nat;
    avatarUrl : ?Text;
    updatedAt : Nat32;
    deleted : Bool;
  };

  public type AssetDocument = {
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

  public type ContactDocument = {
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

  public type AllowanceDocument = {
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

  public type ServiceDocument = {
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
} 