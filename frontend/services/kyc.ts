import { LocalRxdbDatabase } from "../database/local-rxdb";
import { KYCDetails } from "../@types/kyc";
import { sendKYCApprovalEmail } from "./emailService";

export interface KYCSubmission {
  userId: string;
  userType: 'validator' | 'collector' | 'regular';
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    phoneNumber: string;
    email: string;
    gender: string;
    occupation: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  documents: Array<{
    type_: string;
    number: string;
    expiryDate: string;
    fileUrl: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  }>;
  bankDetails?: {
    gcash?: string | null;
    paymaya?: string | null;
    bpi?: {
      accountName: string;
      accountNumber: string;
    } | null;
  } | null;
}

export interface KYCService {
  getKYCDetails(userId: string): Promise<KYCDetails>;
  submitKYC(submission: KYCSubmission): Promise<KYCDetails>;
  updateKYC(userId: string, updates: Partial<KYCDetails>): Promise<KYCDetails>;
  hasCompletedKYC(userId: string): Promise<boolean>;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  validateDate(date: string): boolean;
  compressImage(dataUrl: string): Promise<string>;
}

class KYCServiceImpl implements KYCService {
  private db: LocalRxdbDatabase;

  constructor() {
    this.db = LocalRxdbDatabase.instance;
  }

  async getKYCDetails(userId: string): Promise<KYCDetails> {
    try {
      const kycDetails = await this.db.getKYCDetails(userId);
      
      if (!kycDetails) {
        throw new Error(`KYC details not found for user: ${userId}`);
      }
      
      return kycDetails;
    } catch (error) {
      console.error('Error fetching KYC details:', error);
      throw new Error(`Failed to get KYC details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitKYC(submission: KYCSubmission): Promise<KYCDetails> {
    try {
      // Create KYC details object from submission
      const kycDetails: KYCDetails = {
        userId: submission.userId,
        userType: submission.userType,
        status: 'pending',
        personalInfo: submission.personalInfo,
        address: submission.address,
        documents: submission.documents,
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
      await this.db.addKYCDetails(kycDetails);
      
      return kycDetails;
    } catch (error) {
      console.error('Error submitting KYC:', error);
      throw new Error(`Failed to submit KYC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateKYC(userId: string, updates: Partial<KYCDetails>): Promise<KYCDetails> {
    try {
      // Get existing KYC details
      const existingKYC = await this.getKYCDetails(userId);
      
      // Update KYC details
      const updatedKYC: KYCDetails = {
        ...existingKYC,
        ...updates,
        updatedAt: Date.now()
      };
      
      // Save updated KYC details to database
      await this.db.updateKYCDetails(userId, updatedKYC);

      // Send approval notification if status changed to approved
      if (updates.status === 'approved' && existingKYC.status !== 'approved') {
        await sendKYCApprovalEmail(updatedKYC);
      }
      
      return updatedKYC;
    } catch (error) {
      console.error('Error updating KYC:', error);
      throw new Error(`Failed to update KYC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async hasCompletedKYC(userId: string): Promise<boolean> {
    try {
      const kycDetails = await this.db.getKYCDetails(userId);
      return kycDetails !== null && !kycDetails._deleted;
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+63|09)\d{9}$/;
    return phoneRegex.test(phone);
  }

  validateDate(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today;
  }

  async compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create an image object to load the data URL
      const img = new Image();
      img.onload = () => {
        // Create a canvas with the target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw the image on the canvas, resizing it to 100x100
        ctx.drawImage(img, 0, 0, 100, 100);
        
        // Convert the canvas to a data URL with reduced quality (0.5 = 50%)
        // JPEG is commonly used for photo compression due to good file size reduction
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the source of the image to the input data URL
      img.src = dataUrl;
    });
  }
}

export const kycService = new KYCServiceImpl();