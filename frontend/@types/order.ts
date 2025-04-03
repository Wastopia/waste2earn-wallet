export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'disputed';
export type OrderType = 'buy' | 'sell';

export interface Order {
  id: string;
  userId: string;
  type: OrderType;
  tokenId: string;
  amount: number;
  price: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentDetails?: {
    reference?: string;
    proof?: string;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  cancelledAt?: number;
}
