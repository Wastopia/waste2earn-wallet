import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AllowanceDocument {
  'id' : string,
  'deleted' : boolean,
  'asset' : {
    'logo' : string,
    'name' : string,
    'tokenSymbol' : string,
    'supportedStandards' : Array<string>,
    'address' : string,
    'tokenName' : string,
    'decimal' : string,
    'symbol' : string,
  },
  'updatedAt' : number,
  'subAccountId' : string,
  'spender' : string,
}
export interface AssetDocument {
  'deleted' : boolean,
  'logo' : string,
  'name' : string,
  'tokenSymbol' : string,
  'updatedAt' : number,
  'supportedStandards' : Array<string>,
  'address' : string,
  'tokenName' : string,
  'index' : string,
  'sortIndex' : number,
  'shortDecimal' : string,
  'decimal' : string,
  'subAccounts' : Array<
    {
      'transaction_fee' : string,
      'currency_amount' : string,
      'name' : string,
      'sub_account_id' : string,
      'address' : string,
      'amount' : string,
      'decimal' : number,
      'symbol' : string,
    }
  >,
  'symbol' : string,
}
export interface BankDetails {
  'bpi' : [] | [{ 'accountName' : string, 'accountNumber' : string }],
  'gcash' : [] | [string],
  'paymaya' : [] | [string],
}
export interface ContactDocument {
  'principal' : string,
  'deleted' : boolean,
  'name' : string,
  'updatedAt' : number,
  'accounts' : Array<
    {
      'subaccountId' : string,
      'name' : string,
      'subaccount' : string,
      'tokenSymbol' : string,
    }
  >,
  'accountIdentifier' : string,
}
export interface KYCDocument {
  'status' : string,
  'deleted' : boolean,
  'documents' : Array<
    {
      'expiryDate' : string,
      'type' : string,
      'number' : string,
      'verificationStatus' : string,
      'fileUrl' : string,
    }
  >,
  'bankDetails' : [] | [BankDetails],
  'userId' : string,
  'verificationDetails' : [] | [
    {
      'submittedAt' : bigint,
      'verifiedAt' : [] | [bigint],
      'verifiedBy' : [] | [string],
      'remarks' : [] | [string],
    }
  ],
  'updatedAt' : number,
  'address' : {
    'street' : string,
    'country' : string,
    'city' : string,
    'postalCode' : string,
    'state' : string,
  },
  'personalInfo' : {
    'dateOfBirth' : string,
    'nationality' : string,
    'email' : string,
    'phoneNumber' : string,
    'lastName' : string,
    'firstName' : string,
  },
  'riskLevel' : string,
}
export interface OrderDocument {
  'id' : string,
  'status' : string,
  'deleted' : boolean,
  'paymentMethod' : PaymentMethod,
  'expiresAt' : bigint,
  'createdAt' : bigint,
  'updatedAt' : number,
  'sellerId' : string,
  'escrowId' : [] | [string],
  'price' : number,
  'amount' : number,
}
export interface PaymentMethod {
  'id' : string,
  'methodType' : string,
  'name' : string,
  'details' : PaymentMethodDetails,
}
export interface PaymentMethodDetails {
  'walletAddress' : [] | [string],
  'bankName' : [] | [string],
  'accountName' : [] | [string],
  'accountNumber' : [] | [string],
}
export interface PaymentVerificationDocument {
  'status' : string,
  'deleted' : boolean,
  'orderId' : string,
  'updatedAt' : number,
  'proof' : [] | [string],
  'verifiedAt' : [] | [bigint],
  'verifiedBy' : [] | [string],
}
export type Result = { 'ok' : ValidatorDocument } |
  { 'err' : string };
export type Result_1 = { 'ok' : OrderDocument } |
  { 'err' : string };
export type Result_2 = { 'ok' : KYCDocument } |
  { 'err' : string };
export interface ServiceDocument {
  'principal' : string,
  'deleted' : boolean,
  'name' : string,
  'assets' : Array<
    {
      'principal' : string,
      'logo' : string,
      'tokenSymbol' : string,
      'tokenName' : string,
      'shortDecimal' : string,
      'decimal' : string,
    }
  >,
  'updatedAt' : number,
}
export interface User {
  'status' : string,
  'userId' : string,
  'createdAt' : bigint,
  'email' : string,
  'updatedAt' : number,
  'phoneNumber' : string,
  'lastName' : string,
  'riskLevel' : string,
  'firstName' : string,
}
export interface ValidatorDocument {
  'id' : string,
  'totalOrders' : bigint,
  'deleted' : boolean,
  'name' : string,
  'isActive' : boolean,
  'updatedAt' : number,
  'avatarUrl' : [] | [string],
  'rating' : number,
  'responseTime' : string,
}
export interface _SERVICE {
  'batchUpdateOrderStatus' : ActorMethod<
    [Array<string>, string],
    Array<Result_1>
  >,
  'doesStorageExist' : ActorMethod<[], boolean>,
  'dump' : ActorMethod<
    [],
    Array<
      [
        Principal,
        [
          Array<AssetDocument>,
          Array<ContactDocument>,
          Array<AllowanceDocument>,
          Array<ServiceDocument>,
          Array<OrderDocument>,
          Array<PaymentVerificationDocument>,
          Array<KYCDocument>,
          Array<ValidatorDocument>,
        ],
      ]
    >
  >,
  'getActiveOrders' : ActorMethod<[], Array<OrderDocument>>,
  'getActiveValidators' : ActorMethod<[], Array<ValidatorDocument>>,
  'getAllUsers' : ActorMethod<[], Array<User>>,
  'getKYCByRiskLevel' : ActorMethod<[string], Array<KYCDocument>>,
  'getKYCByStatus' : ActorMethod<[string], Array<KYCDocument>>,
  'getKYCStatistics' : ActorMethod<
    [],
    {
      'highRiskUsers' : bigint,
      'rejectedUsers' : bigint,
      'approvedUsers' : bigint,
      'totalUsers' : bigint,
      'pendingVerifications' : bigint,
    }
  >,
  'getLatestKYCDetails' : ActorMethod<
    [number, [] | [string], bigint],
    Array<KYCDocument>
  >,
  'getLatestOrders' : ActorMethod<
    [number, [] | [string], bigint],
    Array<OrderDocument>
  >,
  'getLatestPaymentVerifications' : ActorMethod<
    [number, [] | [string], bigint],
    Array<PaymentVerificationDocument>
  >,
  'getLatestValidators' : ActorMethod<
    [number, [] | [string], bigint],
    Array<ValidatorDocument>
  >,
  'getOrderById' : ActorMethod<[string], [] | [OrderDocument]>,
  'getOrderStatistics' : ActorMethod<
    [],
    {
      'totalOrders' : bigint,
      'disputedOrders' : bigint,
      'completedOrders' : bigint,
      'activeOrders' : bigint,
    }
  >,
  'getOrdersByDateRange' : ActorMethod<[bigint, bigint], Array<OrderDocument>>,
  'getOrdersByStatus' : ActorMethod<[string], Array<OrderDocument>>,
  'getOrdersByUser' : ActorMethod<[string], Array<OrderDocument>>,
  'getValidatorStatistics' : ActorMethod<
    [],
    {
      'averageRating' : number,
      'totalOrdersProcessed' : bigint,
      'totalValidators' : bigint,
      'activeValidators' : bigint,
    }
  >,
  'getValidatorsByRating' : ActorMethod<[number], Array<ValidatorDocument>>,
  'incrementValidatorOrders' : ActorMethod<[string], Result>,
  'pullAllowances' : ActorMethod<
    [number, [] | [string], bigint],
    Array<AllowanceDocument>
  >,
  'pullAssets' : ActorMethod<
    [number, [] | [string], bigint],
    Array<AssetDocument>
  >,
  'pullContacts' : ActorMethod<
    [number, [] | [string], bigint],
    Array<ContactDocument>
  >,
  'pullKYCDetails' : ActorMethod<
    [number, [] | [string], bigint],
    Array<KYCDocument>
  >,
  'pullOrders' : ActorMethod<
    [number, [] | [string], bigint],
    Array<OrderDocument>
  >,
  'pullPaymentVerifications' : ActorMethod<
    [number, [] | [string], bigint],
    Array<PaymentVerificationDocument>
  >,
  'pullServices' : ActorMethod<
    [number, [] | [string], bigint],
    Array<ServiceDocument>
  >,
  'pullValidators' : ActorMethod<
    [number, [] | [string], bigint],
    Array<ValidatorDocument>
  >,
  'pushAllowances' : ActorMethod<
    [Array<AllowanceDocument>],
    Array<AllowanceDocument>
  >,
  'pushAssets' : ActorMethod<[Array<AssetDocument>], Array<AssetDocument>>,
  'pushContacts' : ActorMethod<
    [Array<ContactDocument>],
    Array<ContactDocument>
  >,
  'pushKYCDetails' : ActorMethod<[Array<KYCDocument>], Array<KYCDocument>>,
  'pushOrders' : ActorMethod<[Array<OrderDocument>], Array<OrderDocument>>,
  'pushPaymentVerifications' : ActorMethod<
    [Array<PaymentVerificationDocument>],
    Array<PaymentVerificationDocument>
  >,
  'pushServices' : ActorMethod<
    [Array<ServiceDocument>],
    Array<ServiceDocument>
  >,
  'pushValidators' : ActorMethod<
    [Array<ValidatorDocument>],
    Array<ValidatorDocument>
  >,
  'updateKYCStatus' : ActorMethod<
    [string, string, string, [] | [string]],
    Result_2
  >,
  'updateOrderStatus' : ActorMethod<[string, string], Result_1>,
  'updateValidatorRating' : ActorMethod<[string, number], Result>,
  'updateValidatorResponseTime' : ActorMethod<[string, string], Result>,
  'updateValidatorStatus' : ActorMethod<[string, boolean], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
