import { KYCUpdateRequest } from '@/database/local-rxdb';

const formatDocuments = (documents?: Array<{ type_: string; number: string; expiryDate: string; verificationStatus: string }>) => {
  if (!documents || documents.length === 0) return 'No documents updated';
  return documents.map(doc => `
    • Type: ${doc.type_}
    • Number: ${doc.number}
    • Expiry Date: ${doc.expiryDate}
    • Status: ${doc.verificationStatus}
  `).join('\n');
};

const formatVerificationDetails = (details?: { submittedAt: number; verifiedAt?: number; verifiedBy?: string; remarks?: string }) => {
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

export const sendKYCUpdateEmail = async (kycUpdate: KYCUpdateRequest, userId: string) => {
  try {
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

    const response = await fetch('https://api.waste2earn.xyz/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'waste2earn.xyz@gmail.com',
        subject: `${getStatusEmoji(kycUpdate.status)} KYC Update - User ${userId} ${getRiskLevelEmoji(kycUpdate.riskLevel)}`,
        content: emailContent,
        priority: kycUpdate.riskLevel === 'high' ? 'high' : 'normal'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    return true;
  } catch (error) {
    console.error('Error sending KYC update email:', error);
    return false;
  }
}; 