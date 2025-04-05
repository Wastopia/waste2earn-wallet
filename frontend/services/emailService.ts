import { KYCUpdateRequest } from '@/database/local-rxdb';
import { KYCDetails } from '@/@types/kyc';
import axios from 'axios';

// Email service configuration
const EMAIL_API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || 'https://api.waste2earn.xyz/notify';
const ADMIN_EMAIL = 'waste2earn.xyz@gmail.com';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY; // Should be set in environment variables

const formatDocuments = (documents?: Array<{ type_: string; number: string; expiryDate: string; verificationStatus: string }>) => {
  if (!documents || documents.length === 0) return 'No documents updated';
  return documents.map(doc => `
    • Type: ${doc.type_}
    • Number: ${doc.number}
    • Expiry Date: ${doc.expiryDate}
    • Status: ${doc.verificationStatus}
  `).join('\n');
};

const formatVerificationDetails = (details?: { submittedAt: number; verifiedAt?: number | null; verifiedBy?: string | null; remarks?: string | null }) => {
  if (!details) return 'No verification details provided';
  return `
    • Submitted: ${new Date(details.submittedAt).toLocaleString()}
    • Verified: ${details.verifiedAt ? new Date(details.verifiedAt).toLocaleString() : 'Pending'}
    • Verified By: ${details.verifiedBy || 'Pending'}
    • Remarks: ${details.remarks || 'No remarks'}
  `;
};

const getRiskLevelEmoji = (riskLevel?: string) => {
  switch (riskLevel?.toLowerCase()) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🔴';
    default: return '⚪';
  }
};

const getStatusEmoji = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'approved': return '✅';
    case 'rejected': return '❌';
    case 'pending': return '⏳';
    default: return '❔';
  }
};

export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  sendKYCNotification(userId: string, message: string): Promise<boolean>;
  sendP2PNotification(userId: string, message: string): Promise<boolean>;
}

class EmailServiceImpl implements EmailService {
  private async sendEmailRequest(data: { to: string; subject: string; content: string; priority?: string }): Promise<boolean> {
    try {
      if (!EMAIL_API_KEY) {
        console.error('Email API key not configured');
        return false;
      }

      const response = await axios.post(EMAIL_API_URL, {
        ...data,
        apiKey: EMAIL_API_KEY
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMAIL_API_KEY}`
        }
      });

      if (response.status === 200) {
        console.log('Email sent successfully:', {
          to: data.to,
          subject: data.subject,
          timestamp: new Date().toISOString()
        });
        return true;
      }

      console.error('Failed to send email:', response.status, response.statusText);
      return false;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    return this.sendEmailRequest({
      to,
      subject,
      content: body
    });
  }

  async sendKYCNotification(userId: string, message: string): Promise<boolean> {
    return this.sendEmailRequest({
      to: ADMIN_EMAIL,
      subject: `KYC Notification - User ${userId}`,
      content: message,
      priority: 'high'
    });
  }

  async sendP2PNotification(userId: string, message: string): Promise<boolean> {
    return this.sendEmailRequest({
      to: ADMIN_EMAIL,
      subject: `P2P Transaction Alert - User ${userId}`,
      content: message,
      priority: 'high'
    });
  }
}

export const emailService = new EmailServiceImpl();

// Export the KYC update email function
export const sendKYCUpdateEmail = async (kycUpdate: KYCUpdateRequest, userId: string): Promise<boolean> => {
  const emailContent = `
🔔 KYC Update Notification

User ID: ${userId}
Timestamp: ${new Date().toLocaleString()}

${kycUpdate.status ? `Status Update ${getStatusEmoji(kycUpdate.status)}
----------------
New Status: ${kycUpdate.status}` : ''}

${kycUpdate.riskLevel ? `Risk Level Update ${getRiskLevelEmoji(kycUpdate.riskLevel)}
-------------------
New Risk Level: ${kycUpdate.riskLevel}` : ''}

${kycUpdate.documents ? `Document Updates 📄
----------------
${formatDocuments(kycUpdate.documents)}` : ''}

${kycUpdate.verificationDetails ? `Verification Details 🔍
-------------------
${formatVerificationDetails(kycUpdate.verificationDetails)}` : ''}

This is an automated notification from the Waste2Earn KYC System.
Please review these changes in the admin dashboard: https://admin.waste2earn.xyz/kyc/${userId}

Best regards,
Waste2Earn KYC System
`;

  return emailService.sendEmail(
    ADMIN_EMAIL,
    `${getStatusEmoji(kycUpdate.status)} KYC Update - User ${userId} ${getRiskLevelEmoji(kycUpdate.riskLevel)}`,
    emailContent
  );
};

export const sendKYCApprovalEmail = async (kycDetails: KYCDetails) => {
  try {
    const emailContent = `
🎉 KYC Application Approved

User Details:
------------
User ID: ${kycDetails.userId}
Name: ${kycDetails.personalInfo.firstName} ${kycDetails.personalInfo.lastName}
Email: ${kycDetails.personalInfo.email}
User Type: ${kycDetails.userType}
Status: ${getStatusEmoji(kycDetails.status)} ${kycDetails.status}
Risk Level: ${getRiskLevelEmoji(kycDetails.riskLevel)} ${kycDetails.riskLevel}

Verification Details:
-------------------
${formatVerificationDetails(kycDetails.verificationDetails)}

Documents:
---------
${formatDocuments(kycDetails.documents)}

Account has been automatically activated.

Review this approval in the admin dashboard: https://admin.waste2earn.xyz/kyc/${kycDetails.userId}

Best regards,
Waste2Earn KYC System
`;

    const response = await fetch('https://api.waste2earn.xyz/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'waste2earn.xyz@gmail.com',
        subject: `✅ KYC Approved - ${kycDetails.personalInfo.firstName} ${kycDetails.personalInfo.lastName}`,
        content: emailContent,
        priority: 'high'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send approval notification');
    }

    return true;
  } catch (error) {
    console.error('Error sending KYC approval email:', error);
    return false;
  }
}; 