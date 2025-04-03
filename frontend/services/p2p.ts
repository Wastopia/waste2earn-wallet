import { Order, PaymentMethod, Escrow, PaymentVerification, Message, MessageRequest } from "@/types/p2p";
import { ORDER_STATUS_TRACKING } from "@/types/p2p";
import { LocalRxdbDatabase } from "@database/local-rxdb";
import { kycService, KYCSubmission } from "./kyc";
import { KYCDetails } from "../@types/kyc";
import { emailService } from "./emailService";

interface Address {
  country: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

interface KYCDocument {
  type_: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface BankDetails {
  bpi?: {
    accountName: string;
    accountNumber: string;
  } | null;
  gcash?: string | null;
  paymaya?: string | null;
}

// Define SuspiciousPattern interface for proper typing
interface SuspiciousPattern {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

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

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.getOrdersByUser(userId);
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

  async validateUserForP2P(userId: string): Promise<boolean> {
    const hasKYC = await kycService.hasCompletedKYC(userId);
    if (!hasKYC) {
      throw new Error('KYC verification required for P2P transactions');
    }
    return true;
  }

  getTransactionLimit(riskLevel: string): number {
    switch(riskLevel) {
      case 'low': return 1000;
      case 'medium': return 5000;
      case 'high': return 10000;
      default: return 1000;
    }
  }

  validateAddressForPayment(address: Address, paymentMethod: PaymentMethod): void {
    if (paymentMethod.type === 'bank' && address.country !== 'Philippines') {
      throw new Error('Bank transfers only available in Philippines');
    }
  }

  validateDocumentsForP2P(documents: KYCDocument[]): void {
    const requiredDocs = ['government_id', 'proof_of_address'];
    const hasRequiredDocs = requiredDocs.every(doc => 
      documents.some(d => d.type_ === doc && d.verificationStatus === 'verified')
    );
    if (!hasRequiredDocs) {
      throw new Error('Required documents not verified');
    }
  }

  validateBankDetails(bankDetails: BankDetails, kycDetails: KYCDetails): void {
    if (bankDetails.bpi?.accountName !== `${kycDetails.personalInfo.firstName} ${kycDetails.personalInfo.lastName}`) {
      throw new Error('Bank account name must match KYC details');
    }
  }

  async validateP2PSubmission(submission: KYCSubmission): Promise<boolean> {
    await this.validateUserForP2P(submission.userId);
    if (submission.documents) {
      this.validateDocumentsForP2P(submission.documents);
    }
    if (submission.bankDetails && submission.personalInfo) {
      // Create a minimal KYCDetails object with just the needed fields
      const kycDetails: Pick<KYCDetails, 'personalInfo'> = {
        personalInfo: submission.personalInfo
      };
      this.validateBankDetails(submission.bankDetails, kycDetails as KYCDetails);
    }
    return true;
  }

  async processKYCForP2P(userId: string): Promise<void> {
    const hasKYC = await kycService.hasCompletedKYC(userId);
    if (!hasKYC) {
      throw new Error('KYC verification required for P2P transactions');
    }
    // Additional processing can be added here
  }

  async updateKYCForP2P(userId: string, _transaction: Order): Promise<void> {
    const hasKYC = await kycService.hasCompletedKYC(userId);
    if (!hasKYC) {
      throw new Error('KYC verification required for P2P transactions');
    }
    // Additional processing can be added here
  }

  showP2PStatus(hasKYC: boolean): string {
    if (!hasKYC) {
      return 'KYC verification required for P2P transactions';
    }
    return 'Ready for P2P transactions';
  }

  async monitorP2PTransactions(userId: string): Promise<void> {
    const transactions = await this.getUserTransactions(userId);
    const suspiciousPatterns = this.detectSuspiciousPatterns(transactions);
    if (suspiciousPatterns.length > 0) {
      // Handle suspicious patterns
      console.log('Suspicious transaction patterns detected');
    }
  }

  async sendP2PNotifications(userId: string, transaction: Order): Promise<void> {
    try {
      // Format the message
      const message = `Transaction Update: ${transaction.status.toUpperCase()}
      Order ID: ${transaction.id}
      Amount: ${transaction.amount}
      Price: ${transaction.price}`;
      
      // Send notification using email service
      await emailService.sendP2PNotification(userId, message);
    } catch (error) {
      console.error('Error sending P2P notification:', error);
    }
  }

  private async getUserTransactions(userId: string): Promise<Order[]> {
    try {
      return await this.getUserOrders(userId);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  private detectSuspiciousPatterns(transactions: Order[]): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    
    // Skip if no transactions
    if (!transactions || transactions.length === 0) {
      return patterns;
    }
    
    // Check for large transactions
    const largeTransactions = transactions.filter(t => 
      t && typeof t.amount === 'number' && t.amount > 10000
    );
    if (largeTransactions.length > 0) {
      patterns.push({
        type: 'large_transaction',
        description: 'Multiple large transactions detected',
        severity: 'high'
      });
    }

    // Check for frequent transactions
    const getDateValue = (date: any): number => {
      if (!date) return 0;
      if (date instanceof Date) return date.getTime();
      if (typeof date === 'number') return date;
      if (typeof date === 'string') {
        const parsed = Date.parse(date);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const last24Hours = transactions.filter(t => {
      if (!t || !t.createdAt) return false;
      const createdAtTime = getDateValue(t.createdAt);
      return createdAtTime > 0 && (Date.now() - createdAtTime < 24 * 60 * 60 * 1000);
    });
    
    if (last24Hours.length > 5) {
      patterns.push({
        type: 'frequent_transaction',
        description: 'Too many transactions in 24 hours',
        severity: 'medium'
      });
    }

    return patterns;
  }
}

export const p2pService = P2PService.getInstance(); 