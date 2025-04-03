import { KYCDetails, KYCSubmission } from "@/@types/kyc";
import { BankDetails } from "../@types/bank";
import { Address } from "../@types/address";
import { PaymentMethod } from "../@types/payment";
import { Order, OrderType } from "../@types/order";
import { kycService } from "../services/kyc";
import { p2pService } from '../services/p2p';
import { emailService } from '../services/emailService';

// Add missing interface for suspicious patterns
interface SuspiciousPattern {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// Add missing functions
const validateUserForP2P = async (userId: string): Promise<boolean> => {
  try {
    // First check if user has completed KYC
    const hasCompletedKYC = await kycService.hasCompletedKYC(userId);
    if (!hasCompletedKYC) {
      return false;
    }
    
    // Then get detailed KYC info to check status and risk level
    const kycDetails = await kycService.getKYCDetails(userId);
    return kycDetails.status === 'approved' && kycDetails.riskLevel !== 'high';
  } catch (error) {
    console.error('Error validating user for P2P:', error);
    return false;
  }
};

const validateDocumentsForP2P = async (userId: string): Promise<boolean> => {
  try {
    // First check if user has completed KYC
    const hasCompletedKYC = await kycService.hasCompletedKYC(userId);
    if (!hasCompletedKYC) {
      return false;
    }
    
    // Then get detailed KYC info to check document verification
    const kycDetails = await kycService.getKYCDetails(userId);
    if (!kycDetails.documents || kycDetails.documents.length === 0) {
      return false;
    }
    return kycDetails.documents.every(doc => doc.verificationStatus === 'verified');
  } catch (error) {
    console.error('Error validating documents for P2P:', error);
    return false;
  }
};

const validateP2PSubmission = async (submission: KYCSubmission): Promise<boolean> => {
  try {
    // Validate required fields
    if (!submission.userId || !submission.userType || !submission.personalInfo || !submission.address) {
      return false;
    }

    // Validate documents
    if (!submission.documents || submission.documents.length === 0) {
      return false;
    }

    // Validate bank details for validators
    if (submission.userType === 'validator' && !submission.bankDetails) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating P2P submission:', error);
    return false;
  }
};

const processKYCForP2P = async (submission: KYCSubmission): Promise<KYCDetails> => {
  try {
    // Transform documents to match expected type
    const transformedSubmission = {
      ...submission,
      documents: submission.documents.map(doc => {
        const kycDoc = doc.toJSON();
        return kycDoc.documents[0] || {
          type_: '',
          number: '',
          expiryDate: '',
          fileUrl: '',
          verificationStatus: 'pending' as const
        };
      })
    };
    const kycDetails = await kycService.submitKYC(transformedSubmission);
    return kycDetails;
  } catch (error) {
    console.error('Error processing KYC for P2P:', error);
    throw error;
  }
};

const updateKYCForP2P = async (userId: string, updates: Partial<KYCDetails>): Promise<KYCDetails> => {
  try {
    const updatedKYC = await kycService.updateKYC(userId, updates);
    return updatedKYC;
  } catch (error) {
    console.error('Error updating KYC for P2P:', error);
    throw error;
  }
};

const showP2PStatus = async (userId: string): Promise<{
  canTrade: boolean;
  limit: number;
  riskLevel: string;
}> => {
  try {
    // First check if user has completed KYC
    const hasCompletedKYC = await kycService.hasCompletedKYC(userId);
    if (!hasCompletedKYC) {
      return {
        canTrade: false,
        limit: 0,
        riskLevel: 'none'
      };
    }
    
    // Then get detailed KYC info
    const kycDetails = await kycService.getKYCDetails(userId);
    const limit = getTransactionLimit(kycDetails);
    
    return {
      canTrade: kycDetails.status === 'approved' && kycDetails.riskLevel !== 'high',
      limit,
      riskLevel: kycDetails.riskLevel
    };
  } catch (error) {
    console.error('Error showing P2P status:', error);
    return {
      canTrade: false,
      limit: 0,
      riskLevel: 'error'
    };
  }
};

const monitorP2PTransactions = async (userId: string): Promise<SuspiciousPattern[]> => {
  try {
    // Get orders from P2P service and transform them to match expected structure
    const p2pOrders = await p2pService.getOrdersByUser(userId);
    
    // Transform the orders to match the structure expected by detectSuspiciousPatterns
    const transformedOrders = p2pOrders.map(order => {
      // Create a compatible order object that has all required properties
      return {
        id: order.id,
        userId: userId, // Use the provided userId since it might not exist in p2p Order
        type: 'buy',    // Default type
        tokenId: order.id, // Use order id as tokenId if not available
        amount: order.amount,
        price: order.price || 0,
        status: order.status as any, // Cast status to handle type differences
        paymentMethod: typeof order.paymentMethod === 'string' ? 
          order.paymentMethod : 
          (order.paymentMethod?.id || ''),
        createdAt: order.createdAt instanceof Date ? 
          order.createdAt.getTime() : 
          typeof order.createdAt === 'number' ? 
            order.createdAt : Date.now(),
        updatedAt: Date.now() // Add updatedAt field
      } as Order;
    });
    
    return detectSuspiciousPatterns(transformedOrders);
  } catch (error) {
    console.error('Error monitoring P2P transactions:', error);
    return [];
  }
};

const sendP2PNotifications = async (userId: string, message: string): Promise<void> => {
  try {
    await emailService.sendP2PNotification(userId, message);
  } catch (error) {
    console.error('Error sending P2P notifications:', error);
    throw error;
  }
};

// Type-safe helper functions
const validatePaymentMethod = (method: PaymentMethod): boolean => {
  return method.isActive && ['bank', 'gcash', 'paymaya'].includes(method.type);
};

const createOrder = (
  userId: string,
  type: OrderType,
  tokenId: string,
  amount: number,
  price: number,
  paymentMethod: string
): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    userId,
    type,
    tokenId,
    amount,
    price,
    status: 'pending',
    paymentMethod,
  };
};

const validateAddressForPayment = (address: Address, paymentMethod: PaymentMethod): boolean => {
  if (paymentMethod.type === 'bank' && address.country !== 'Philippines') {
    throw new Error('Bank transfers only available in Philippines');
  }
  return true;
};

const validateBankDetails = (bankDetails: BankDetails, kycDetails: KYCDetails): boolean => {
  if (
    bankDetails.bpi?.accountName !== 
    `${kycDetails.personalInfo.firstName} ${kycDetails.personalInfo.lastName}`
  ) {
    throw new Error('Bank account name must match KYC details');
  }
  return true;
};

const detectSuspiciousPatterns = (transactions: Order[]): SuspiciousPattern[] => {
  const patterns: SuspiciousPattern[] = [];
  
  // Check for large transactions
  const largeTransactions = transactions.filter(t => t.amount > 10000);
  if (largeTransactions.length > 0) {
    patterns.push({
      type: 'large_transaction',
      description: 'Multiple large transactions detected',
      severity: 'high'
    });
  }

  // Check for frequent transactions
  const last24Hours = transactions.filter(t => 
    Date.now() - t.createdAt < 24 * 60 * 60 * 1000
  );
  if (last24Hours.length > 5) {
    patterns.push({
      type: 'frequent_transaction',
      description: 'Too many transactions in 24 hours',
      severity: 'medium'
    });
  }

  return patterns;
};

const getTransactionLimit = (kycDetails: KYCDetails): number => {
  switch(kycDetails.riskLevel) {
    case 'low': return 1000;
    case 'medium': return 5000;
    case 'high': return 10000;
    default: return 0;
  }
};

// Export all functions that need to be used externally
export {
  validateUserForP2P,
  getTransactionLimit,
  validateAddressForPayment,
  validateDocumentsForP2P,
  validateBankDetails,
  validateP2PSubmission,
  processKYCForP2P,
  updateKYCForP2P,
  showP2PStatus,
  monitorP2PTransactions,
  sendP2PNotifications,
  validatePaymentMethod,
  createOrder
};
  