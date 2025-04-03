export type PaymentMethodType = 'bank' | 'gcash' | 'paymaya';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  accountNumber?: string;
  accountName?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
