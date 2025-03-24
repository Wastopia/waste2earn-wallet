export const idlFactory = ({ IDL }) => {
  const PaymentMethodDetails = IDL.Record({
    'walletAddress' : IDL.Opt(IDL.Text),
    'bankName' : IDL.Opt(IDL.Text),
    'accountName' : IDL.Opt(IDL.Text),
    'accountNumber' : IDL.Opt(IDL.Text),
  });
  const PaymentMethod = IDL.Record({
    'id' : IDL.Text,
    'methodType' : IDL.Text,
    'name' : IDL.Text,
    'details' : PaymentMethodDetails,
  });
  const OrderDocument = IDL.Record({
    'id' : IDL.Text,
    'status' : IDL.Text,
    'deleted' : IDL.Bool,
    'paymentMethod' : PaymentMethod,
    'expiresAt' : IDL.Int,
    'createdAt' : IDL.Int,
    'updatedAt' : IDL.Nat32,
    'sellerId' : IDL.Text,
    'escrowId' : IDL.Opt(IDL.Text),
    'price' : IDL.Float64,
    'amount' : IDL.Float64,
  });
  const Result_1 = IDL.Variant({ 'ok' : OrderDocument, 'err' : IDL.Text });
  const AssetDocument = IDL.Record({
    'deleted' : IDL.Bool,
    'logo' : IDL.Text,
    'name' : IDL.Text,
    'tokenSymbol' : IDL.Text,
    'updatedAt' : IDL.Nat32,
    'supportedStandards' : IDL.Vec(IDL.Text),
    'address' : IDL.Text,
    'tokenName' : IDL.Text,
    'index' : IDL.Text,
    'sortIndex' : IDL.Nat32,
    'shortDecimal' : IDL.Text,
    'decimal' : IDL.Text,
    'subAccounts' : IDL.Vec(
      IDL.Record({
        'transaction_fee' : IDL.Text,
        'currency_amount' : IDL.Text,
        'name' : IDL.Text,
        'sub_account_id' : IDL.Text,
        'address' : IDL.Text,
        'amount' : IDL.Text,
        'decimal' : IDL.Nat32,
        'symbol' : IDL.Text,
      })
    ),
    'symbol' : IDL.Text,
  });
  const ContactDocument = IDL.Record({
    'principal' : IDL.Text,
    'deleted' : IDL.Bool,
    'name' : IDL.Text,
    'updatedAt' : IDL.Nat32,
    'accounts' : IDL.Vec(
      IDL.Record({
        'subaccountId' : IDL.Text,
        'name' : IDL.Text,
        'subaccount' : IDL.Text,
        'tokenSymbol' : IDL.Text,
      })
    ),
    'accountIdentifier' : IDL.Text,
  });
  const AllowanceDocument = IDL.Record({
    'id' : IDL.Text,
    'deleted' : IDL.Bool,
    'asset' : IDL.Record({
      'logo' : IDL.Text,
      'name' : IDL.Text,
      'tokenSymbol' : IDL.Text,
      'supportedStandards' : IDL.Vec(IDL.Text),
      'address' : IDL.Text,
      'tokenName' : IDL.Text,
      'decimal' : IDL.Text,
      'symbol' : IDL.Text,
    }),
    'updatedAt' : IDL.Nat32,
    'subAccountId' : IDL.Text,
    'spender' : IDL.Text,
  });
  const ServiceDocument = IDL.Record({
    'principal' : IDL.Text,
    'deleted' : IDL.Bool,
    'name' : IDL.Text,
    'assets' : IDL.Vec(
      IDL.Record({
        'principal' : IDL.Text,
        'logo' : IDL.Text,
        'tokenSymbol' : IDL.Text,
        'tokenName' : IDL.Text,
        'shortDecimal' : IDL.Text,
        'decimal' : IDL.Text,
      })
    ),
    'updatedAt' : IDL.Nat32,
  });
  const PaymentVerificationDocument = IDL.Record({
    'status' : IDL.Text,
    'deleted' : IDL.Bool,
    'orderId' : IDL.Text,
    'updatedAt' : IDL.Nat32,
    'proof' : IDL.Opt(IDL.Text),
    'verifiedAt' : IDL.Opt(IDL.Int),
    'verifiedBy' : IDL.Opt(IDL.Text),
  });
  const BankDetails = IDL.Record({
    'bpi' : IDL.Opt(
      IDL.Record({ 'accountName' : IDL.Text, 'accountNumber' : IDL.Text })
    ),
    'gcash' : IDL.Opt(IDL.Text),
    'paymaya' : IDL.Opt(IDL.Text),
  });
  const KYCDocument = IDL.Record({
    'status' : IDL.Text,
    'deleted' : IDL.Bool,
    'documents' : IDL.Vec(
      IDL.Record({
        'expiryDate' : IDL.Text,
        'type' : IDL.Text,
        'number' : IDL.Text,
        'verificationStatus' : IDL.Text,
        'fileUrl' : IDL.Text,
      })
    ),
    'bankDetails' : IDL.Opt(BankDetails),
    'userId' : IDL.Text,
    'verificationDetails' : IDL.Opt(
      IDL.Record({
        'submittedAt' : IDL.Int,
        'verifiedAt' : IDL.Opt(IDL.Int),
        'verifiedBy' : IDL.Opt(IDL.Text),
        'remarks' : IDL.Opt(IDL.Text),
      })
    ),
    'updatedAt' : IDL.Nat32,
    'address' : IDL.Record({
      'street' : IDL.Text,
      'country' : IDL.Text,
      'city' : IDL.Text,
      'postalCode' : IDL.Text,
      'state' : IDL.Text,
    }),
    'personalInfo' : IDL.Record({
      'dateOfBirth' : IDL.Text,
      'nationality' : IDL.Text,
      'email' : IDL.Text,
      'phoneNumber' : IDL.Text,
      'lastName' : IDL.Text,
      'firstName' : IDL.Text,
    }),
    'riskLevel' : IDL.Text,
  });
  const ValidatorDocument = IDL.Record({
    'id' : IDL.Text,
    'totalOrders' : IDL.Nat,
    'deleted' : IDL.Bool,
    'name' : IDL.Text,
    'isActive' : IDL.Bool,
    'updatedAt' : IDL.Nat32,
    'avatarUrl' : IDL.Opt(IDL.Text),
    'rating' : IDL.Float64,
    'responseTime' : IDL.Text,
  });
  const User = IDL.Record({
    'status' : IDL.Text,
    'userId' : IDL.Text,
    'createdAt' : IDL.Int,
    'email' : IDL.Text,
    'updatedAt' : IDL.Nat32,
    'phoneNumber' : IDL.Text,
    'lastName' : IDL.Text,
    'riskLevel' : IDL.Text,
    'firstName' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : ValidatorDocument, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : KYCDocument, 'err' : IDL.Text });
  return IDL.Service({
    'batchUpdateOrderStatus' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Text],
        [IDL.Vec(Result_1)],
        [],
      ),
    'doesStorageExist' : IDL.Func([], [IDL.Bool], ['query']),
    'dump' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Principal,
              IDL.Tuple(
                IDL.Vec(AssetDocument),
                IDL.Vec(ContactDocument),
                IDL.Vec(AllowanceDocument),
                IDL.Vec(ServiceDocument),
                IDL.Vec(OrderDocument),
                IDL.Vec(PaymentVerificationDocument),
                IDL.Vec(KYCDocument),
                IDL.Vec(ValidatorDocument),
              ),
            )
          ),
        ],
        ['query'],
      ),
    'getActiveOrders' : IDL.Func([], [IDL.Vec(OrderDocument)], []),
    'getActiveValidators' : IDL.Func([], [IDL.Vec(ValidatorDocument)], []),
    'getAllUsers' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'getKYCByRiskLevel' : IDL.Func([IDL.Text], [IDL.Vec(KYCDocument)], []),
    'getKYCByStatus' : IDL.Func([IDL.Text], [IDL.Vec(KYCDocument)], []),
    'getKYCStatistics' : IDL.Func(
        [],
        [
          IDL.Record({
            'highRiskUsers' : IDL.Nat,
            'rejectedUsers' : IDL.Nat,
            'approvedUsers' : IDL.Nat,
            'totalUsers' : IDL.Nat,
            'pendingVerifications' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getLatestKYCDetails' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(KYCDocument)],
        ['query'],
      ),
    'getLatestOrders' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(OrderDocument)],
        ['query'],
      ),
    'getLatestPaymentVerifications' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(PaymentVerificationDocument)],
        ['query'],
      ),
    'getLatestValidators' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(ValidatorDocument)],
        ['query'],
      ),
    'getOrderById' : IDL.Func([IDL.Text], [IDL.Opt(OrderDocument)], []),
    'getOrderStatistics' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalOrders' : IDL.Nat,
            'disputedOrders' : IDL.Nat,
            'completedOrders' : IDL.Nat,
            'activeOrders' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getOrdersByDateRange' : IDL.Func(
        [IDL.Int, IDL.Int],
        [IDL.Vec(OrderDocument)],
        [],
      ),
    'getOrdersByStatus' : IDL.Func([IDL.Text], [IDL.Vec(OrderDocument)], []),
    'getOrdersByUser' : IDL.Func([IDL.Text], [IDL.Vec(OrderDocument)], []),
    'getValidatorStatistics' : IDL.Func(
        [],
        [
          IDL.Record({
            'averageRating' : IDL.Float64,
            'totalOrdersProcessed' : IDL.Nat,
            'totalValidators' : IDL.Nat,
            'activeValidators' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getValidatorsByRating' : IDL.Func(
        [IDL.Float64],
        [IDL.Vec(ValidatorDocument)],
        [],
      ),
    'incrementValidatorOrders' : IDL.Func([IDL.Text], [Result], []),
    'pullAllowances' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(AllowanceDocument)],
        ['query'],
      ),
    'pullAssets' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(AssetDocument)],
        ['query'],
      ),
    'pullContacts' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(ContactDocument)],
        ['query'],
      ),
    'pullKYCDetails' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(KYCDocument)],
        ['query'],
      ),
    'pullOrders' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(OrderDocument)],
        ['query'],
      ),
    'pullPaymentVerifications' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(PaymentVerificationDocument)],
        ['query'],
      ),
    'pullServices' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(ServiceDocument)],
        ['query'],
      ),
    'pullValidators' : IDL.Func(
        [IDL.Nat32, IDL.Opt(IDL.Text), IDL.Nat],
        [IDL.Vec(ValidatorDocument)],
        ['query'],
      ),
    'pushAllowances' : IDL.Func(
        [IDL.Vec(AllowanceDocument)],
        [IDL.Vec(AllowanceDocument)],
        [],
      ),
    'pushAssets' : IDL.Func(
        [IDL.Vec(AssetDocument)],
        [IDL.Vec(AssetDocument)],
        [],
      ),
    'pushContacts' : IDL.Func(
        [IDL.Vec(ContactDocument)],
        [IDL.Vec(ContactDocument)],
        [],
      ),
    'pushKYCDetails' : IDL.Func(
        [IDL.Vec(KYCDocument)],
        [IDL.Vec(KYCDocument)],
        [],
      ),
    'pushOrders' : IDL.Func(
        [IDL.Vec(OrderDocument)],
        [IDL.Vec(OrderDocument)],
        [],
      ),
    'pushPaymentVerifications' : IDL.Func(
        [IDL.Vec(PaymentVerificationDocument)],
        [IDL.Vec(PaymentVerificationDocument)],
        [],
      ),
    'pushServices' : IDL.Func(
        [IDL.Vec(ServiceDocument)],
        [IDL.Vec(ServiceDocument)],
        [],
      ),
    'pushValidators' : IDL.Func(
        [IDL.Vec(ValidatorDocument)],
        [IDL.Vec(ValidatorDocument)],
        [],
      ),
    'updateKYCStatus' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text)],
        [Result_2],
        [],
      ),
    'updateOrderStatus' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'updateValidatorRating' : IDL.Func([IDL.Text, IDL.Float64], [Result], []),
    'updateValidatorResponseTime' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'updateValidatorStatus' : IDL.Func([IDL.Text, IDL.Bool], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
