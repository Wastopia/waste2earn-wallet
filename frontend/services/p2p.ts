import { Order, PaymentMethod, Escrow, PaymentVerification, Message, MessageRequest } from "@/types/p2p";
import { ORDER_STATUS_TRACKING } from "@/types/p2p";
import { LocalRxdbDatabase } from "@database/local-rxdb";

class P2PService {
  private static instance: P2PService;
  private readonly ESCROW_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private db: LocalRxdbDatabase;

  private constructor() {
    this.db = LocalRxdbDatabase.instance;
  }

  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  async createOrder(order: Omit<Order, "id" | "createdAt" | "status" | "expiresAt">): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      status: ORDER_STATUS_TRACKING.CREATED,
      expiresAt: new Date(Date.now() + this.ESCROW_TIMEOUT),
    };

    return this.db.createOrder(newOrder);
  }

  async lockTokensInEscrow(order: Order): Promise<Escrow> {
    const escrow: Escrow = {
      id: Math.random().toString(36).substr(2, 9),
      orderId: order.id,
      amount: order.amount,
      status: "locked",
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + this.ESCROW_TIMEOUT),
    };

    // TODO: Implement escrow in RxDB schema
    return escrow;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    await this.db.updateOrder(orderId, { status });
  }

  async getAvailableOrders(): Promise<Order[]> {
    return this.db.getOrdersByStatus(ORDER_STATUS_TRACKING.CREATED);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.db.getOrder(orderId);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.db.getOrdersByUser(userId);
  }

  async createPaymentVerification(verification: Omit<PaymentVerification, "status">): Promise<PaymentVerification> {
    const newVerification: PaymentVerification = {
      ...verification,
      status: "pending",
    };

    return this.db.createPaymentVerification(newVerification);
  }

  async verifyPayment(orderId: string): Promise<boolean> {
    const verification = await this.db.getPaymentVerification(orderId);
    if (!verification) {
      return false;
    }

    await this.db.updatePaymentVerification(orderId, { 
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: "system" // TODO: Replace with actual verifier
    });

    await this.db.updateOrder(orderId, { status: "completed" });
    return true;
  }

  async disputeOrder(orderId: string): Promise<boolean> {
    const order = await this.db.getOrder(orderId);
    if (!order) {
      return false;
    }

    await this.db.updateOrder(orderId, { status: "disputed" });
    return true;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // This would typically come from a backend service
    return [
      {
        id: "gcash",
        name: "GCash",
        type: "gcash",
        details: {
          walletAddress: "09123456789",
        },
      },
      {
        id: "maya",
        name: "Maya",
        type: "maya",
        details: {
          walletAddress: "09123456789",
        },
      },
      {
        id: "bpi",
        name: "BPI",
        type: "bank",
        details: {
          accountNumber: "1234567890",
          accountName: "Waste2Earn",
          bankName: "Bank of the Philippine Islands",
        },
      },
    ];
  }

  async sendMessage(message: MessageRequest): Promise<void> {
    // Implement your message sending logic here
    // For example, API call to your backend
    await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  async getNewMessages(orderId?: string): Promise<Message[]> {
    // Implement your message fetching logic here
    const response = await fetch(`/api/messages?orderId=${orderId}`);
    return response.json();
  }
}

export const p2pService = P2PService.getInstance(); 