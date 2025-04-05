import { LocalRxdbDatabase } from './local-rxdb';
import { KYCDetails, KYCSubmission } from '@/@types/kyc';
import { Order, PaymentVerification } from '@/types/p2p';
import { Contact } from '@redux/models/ContactsModels';
import { Asset } from '@redux/models/AccountModels';
import { emailService } from '@/services/emailService';

type KYCDocument = KYCDetails['documents'][number];

class DatabaseAPI {
  private static instance: DatabaseAPI;
  private db: LocalRxdbDatabase;

  private constructor() {
    this.db = LocalRxdbDatabase.instance;
  }

  public static getInstance(): DatabaseAPI {
    if (!DatabaseAPI.instance) {
      DatabaseAPI.instance = new DatabaseAPI();
    }
    return DatabaseAPI.instance;
  }

  // KYC Operations
  async createKYC(submission: KYCSubmission): Promise<KYCDetails | null> {
    try {
      // Transform the documents to match KYCDetails format
      const transformedDocuments: KYCDocument[] = submission.documents.map(doc => {
        const docData = doc.toJSON();
        return {
          type_: docData.documents[0].type_,
          number: docData.documents[0].number,
          expiryDate: docData.documents[0].expiryDate,
          fileUrl: docData.documents[0].fileUrl,
          verificationStatus: docData.documents[0].verificationStatus as 'pending' | 'verified' | 'rejected'
        };
      });

      const kycDetails: KYCDetails = {
        userId: submission.userId,
        userType: submission.userType,
        status: 'pending',
        personalInfo: submission.personalInfo,
        address: submission.address,
        documents: transformedDocuments,
        verificationDetails: {
          submittedAt: Date.now(),
        },
        riskLevel: 'medium',
        bankDetails: submission.bankDetails,
        updatedAt: Date.now(),
        deleted: false,
        _deleted: false
      };
      
      // Save KYC details to database
      const savedKYC = await this.db.addKYCDetails(kycDetails);
      
      if (savedKYC) {
        // Send registration email notification
        const emailContent = `
🆕 New KYC Registration Submitted

User Details:
------------
User ID: ${savedKYC.userId}
Name: ${savedKYC.personalInfo.firstName} ${savedKYC.personalInfo.lastName}
Email: ${savedKYC.personalInfo.email}
Phone: ${savedKYC.personalInfo.phoneNumber}
User Type: ${savedKYC.userType}

Address:
--------
${savedKYC.address.street}
${savedKYC.address.city}, ${savedKYC.address.state}
${savedKYC.address.country} ${savedKYC.address.postalCode}

Documents Submitted: ${savedKYC.documents.length}
${savedKYC.documents.map(doc => `- ${doc.type_} (${doc.verificationStatus})`).join('\n')}

Submission Time: ${new Date(savedKYC.verificationDetails.submittedAt).toLocaleString()}

Please review this application in the admin dashboard:
https://admin.waste2earn.xyz/kyc/${savedKYC.userId}

Best regards,
Waste2Earn KYC System
`;

        await emailService.sendEmail(
          'waste2earn.xyz@gmail.com',
          `📝 New KYC Registration - ${savedKYC.personalInfo.firstName} ${savedKYC.personalInfo.lastName}`,
          emailContent
        );
      }
      
      return savedKYC;
    } catch (error) {
      console.error('Error creating KYC:', error);
      return null;
    }
  }

  async getKYC(userId: string): Promise<KYCDetails | null> {
    try {
      return await this.db.getKYCDetails(userId);
    } catch (error) {
      console.error('Error getting KYC:', error);
      return null;
    }
  }

  async updateKYC(userId: string, updates: Partial<KYCDetails>): Promise<KYCDetails | null> {
    try {
      return await this.db.updateKYCDetails(userId, updates);
    } catch (error) {
      console.error('Error updating KYC:', error);
      return null;
    }
  }

  // P2P Operations
  async createOrder(order: Order): Promise<void> {
    try {
      await this.db.addOrder(order);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      return await this.db.getOrderById(orderId);
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      await this.db.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getOpenOrders(): Promise<Order[]> {
    try {
      return await this.db.getOpenOrders();
    } catch (error) {
      console.error('Error getting open orders:', error);
      return [];
    }
  }

  async createPaymentVerification(verification: PaymentVerification): Promise<void> {
    try {
      await this.db.addPaymentVerification(verification);
    } catch (error) {
      console.error('Error creating payment verification:', error);
      throw error;
    }
  }

  // Contact Operations
  async getContacts(): Promise<Contact[]> {
    try {
      return await this.db.getContacts();
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  async addContact(contact: Contact): Promise<void> {
    try {
      await this.db.addContact(contact);
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  async updateContact(principal: string, contact: Contact): Promise<void> {
    try {
      await this.db.updateContact(principal, contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Asset Operations
  async getAssets(): Promise<Asset[]> {
    try {
      return await this.db.getAssets();
    } catch (error) {
      console.error('Error getting assets:', error);
      return [];
    }
  }

  async getAsset(address: string): Promise<Asset | null> {
    try {
      return await this.db.getAsset(address);
    } catch (error) {
      console.error('Error getting asset:', error);
      return null;
    }
  }

  async updateAsset(address: string, asset: Asset): Promise<void> {
    try {
      await this.db.updateAsset(address, asset);
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  }

  // Search Operations
  async searchKYCByStatus(status: KYCDetails['status']): Promise<KYCDetails[]> {
    try {
      const allKYC = await Promise.all(
        (await this.db.getContacts()).map(async (contact) => {
          const kyc = await this.db.getKYCDetails(contact.principal);
          return kyc;
        })
      );
      return allKYC.filter((kyc): kyc is KYCDetails => 
        kyc !== null && kyc.status === status
      );
    } catch (error) {
      console.error('Error searching KYC by status:', error);
      return [];
    }
  }

  async searchKYCByRiskLevel(riskLevel: KYCDetails['riskLevel']): Promise<KYCDetails[]> {
    try {
      const allKYC = await Promise.all(
        (await this.db.getContacts()).map(async (contact) => {
          const kyc = await this.db.getKYCDetails(contact.principal);
          return kyc;
        })
      );
      return allKYC.filter((kyc): kyc is KYCDetails => 
        kyc !== null && kyc.riskLevel === riskLevel
      );
    } catch (error) {
      console.error('Error searching KYC by risk level:', error);
      return [];
    }
  }

  async searchOrdersByUser(userId: string): Promise<Order[]> {
    try {
      const allOrders = await this.db.getOpenOrders();
      return allOrders.filter(order => order.sellerId === userId);
    } catch (error) {
      console.error('Error searching orders by user:', error);
      return [];
    }
  }

  // Utility Operations
  async isKYCCompleted(userId: string): Promise<boolean> {
    try {
      const kyc = await this.getKYC(userId);
      return kyc !== null && !kyc._deleted;
    } catch (error) {
      console.error('Error checking KYC completion:', error);
      return false;
    }
  }

  async getKYCCount(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    try {
      const allKYC = await Promise.all(
        (await this.db.getContacts()).map(async (contact) => {
          const kyc = await this.db.getKYCDetails(contact.principal);
          return kyc;
        })
      );
      
      const validKYC = allKYC.filter((kyc): kyc is KYCDetails => kyc !== null);
      
      return {
        total: validKYC.length,
        pending: validKYC.filter(kyc => kyc.status === 'pending').length,
        approved: validKYC.filter(kyc => kyc.status === 'approved').length,
        rejected: validKYC.filter(kyc => kyc.status === 'rejected').length
      };
    } catch (error) {
      console.error('Error getting KYC count:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }
}

export const dbAPI = DatabaseAPI.getInstance(); 