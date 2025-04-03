export interface BankDetails {
  gcash?: string | null;
  paymaya?: string | null;
  bpi?: {
    accountName: string;
    accountNumber: string;
  } | null;
}
