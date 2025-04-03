import { RxDocument, RxCollection } from 'rxdb';

export interface KYCDetails {
  userId: string;
  userType: 'validator' | 'collector' | 'regular';
  status: 'pending' | 'approved' | 'rejected';
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
  verificationDetails: {
    submittedAt: number;
    verifiedAt?: number | null;
    verifiedBy?: string | null;
    remarks?: string | null;
  };
  riskLevel: 'low' | 'medium' | 'high';
  bankDetails?: {
    gcash?: string | null;
    paymaya?: string | null;
    bpi?: {
      accountName: string;
      accountNumber: string;
    } | null;
  } | null;
  _deleted: boolean;
  deleted: boolean;  // For RxDB compatibility
  updatedAt: number;
}

export type RxKYCDocument = RxDocument<KYCDetails>;
export type RxKYCCollection = RxCollection<KYCDetails>;

// Helper type to convert RxDB's DeepReadonly types back to mutable
export type MutableKYCDetails = {
  -readonly [K in keyof KYCDetails]: K extends 'documents' 
    ? Array<KYCDetails['documents'][number]> 
    : K extends keyof KYCDetails 
      ? KYCDetails[K] extends ReadonlyArray<any> 
        ? Array<KYCDetails[K][number]> 
        : KYCDetails[K]
      : never;
};

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
  documents: RxKYCDocument[];
  bankDetails?: {
    gcash?: string | null;
    paymaya?: string | null;
    bpi?: {
      accountName: string;
      accountNumber: string;
    } | null;
  } | null;
}