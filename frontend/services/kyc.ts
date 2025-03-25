import { LocalRxdbDatabase } from "@database/local-rxdb";

// Use exact string literals to match the database schema
export interface KYCPersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;
  email: string;
  gender: string;
  occupation: string;
}

export interface KYCAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface KYCDocument {
  type_: string;
  number: string;
  expiryDate: string;
  fileUrl: string;
  verificationStatus: "pending" | "verified" | "rejected";
}

export interface KYCBankDetails {
  gcash?: string;
  paymaya?: string;
  bpi?: {
    accountName: string;
    accountNumber: string;
  };
}

export interface KYCDetails {
  userId: string;
  status: "pending" | "approved" | "rejected";
  personalInfo: KYCPersonalInfo;
  address: KYCAddress;
  documents: Array<{
    type_: string;
    number: string;
    expiryDate: string;
    fileUrl: string;
    verificationStatus: "pending" | "verified" | "rejected";
  }>;
  verificationDetails: {
    submittedAt: number;
    verifiedAt?: number;
    verifiedBy?: string;
    remarks?: string;
  };
  riskLevel: "low" | "medium" | "high";
  bankDetails?: KYCBankDetails;
  updatedAt: number;
  deleted: boolean;
}

export interface KYCSubmission {
  userId: string;
  personalInfo: KYCPersonalInfo;
  address: KYCAddress;
  profilePhoto: string;
  bankDetails?: KYCBankDetails;
  userType: 'validator' | 'collector' | 'regular';
}

class KYCService {
  /**
   * Submit KYC details for a new user
   * @param submission KYC submission data
   */
  async submitKYC(submission: KYCSubmission): Promise<void> {
    try {
      const db = LocalRxdbDatabase.instance;
      
      // Format the data according to the KYC schema
      const kycData: KYCDetails = {
        userId: submission.userId,
        status: "pending",
        personalInfo: submission.personalInfo,
        address: submission.address,
        documents: [{
          type_: 'profile_photo',
          number: 'N/A',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fileUrl: submission.profilePhoto,
          verificationStatus: "pending"
        }],
        verificationDetails: {
          submittedAt: Date.now(),
          verifiedAt: undefined,
          verifiedBy: undefined,
          remarks: undefined
        },
        bankDetails: submission.userType === 'validator' && submission.bankDetails ? {
          gcash: submission.bankDetails.gcash || '',
          paymaya: submission.bankDetails.paymaya || '',
          bpi: submission.bankDetails.bpi
        } : undefined,
        riskLevel: "medium",
        updatedAt: Math.floor(Date.now() / 1000),
        deleted: false
      };

      await db.addKYCDetails(kycData);
    } catch (error) {
      console.error('Error submitting KYC details:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to submit KYC details');
    }
  }

  /**
   * Update existing KYC details
   * @param userId The user's principal ID
   * @param updates Partial KYC details to update
   */
  async updateKYCDetails(userId: string, updates: Partial<KYCDetails>): Promise<void> {
    try {
      const db = LocalRxdbDatabase.instance;
      await db.updateKYCDetails(userId, {
        ...updates,
        updatedAt: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      console.error('Error updating KYC details:', error);
      throw new Error('Failed to update KYC details');
    }
  }

  /**
   * Check if a user has completed KYC
   * @param userId The user's principal ID
   */
  async hasCompletedKYC(userId: string): Promise<boolean> {
    try {
      // Check if the user has KYC details by attempting to update
      // This is a workaround since we don't have a direct getter
      const result = await LocalRxdbDatabase.instance.updateKYCDetails(
        userId, 
        { updatedAt: Math.floor(Date.now() / 1000) }
      );
      return !!result && result.status !== "rejected";
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  /**
   * Validate email format
   * @param email Email to validate
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param phone Phone number to validate
   */
  validatePhone(phone: string): boolean {
    // Basic validation for Philippines numbers
    // Allows +63XXXXXXXXXX or 09XXXXXXXXX format
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate date format and ensure it's not in the future
   * @param date Date string in YYYY-MM-DD format
   */
  validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const inputDate = new Date(date);
    const today = new Date();
    
    return inputDate instanceof Date && !isNaN(inputDate.getTime()) && inputDate <= today;
  }

  /**
   * Compress an image before storing it
   * @param dataUrl Image as data URL
   * @param maxWidth Maximum width of the image
   * @param quality Image quality (0-1)
   */
  async compressImage(dataUrl: string, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = dataUrl;
    });
  }
}

export const kycService = new KYCService(); 