import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

// Your Divvi Identifier - keep this in environment variables
const DIVVI_CONSUMER_ID =  '0xC436Ebb132fb4E39F25a044ded4B8052ab26CD6f';

export interface ReferralData {
  txHash: string;
  chainId: number;
  userAddress: string;
}

export class DivviService {
  // Generate referral tag for a user
  static generateReferralTag(userAddress: string): string {
    try {
      return getReferralTag({
        user: userAddress,
        consumer: DIVVI_CONSUMER_ID,
      });
    } catch (error) {
      console.error('Error generating referral tag:', error);
      return ''; // Return empty string if Divvi fails
    }
  }

  // Submit referral after transaction is confirmed
  static async submitReferral(referralData: ReferralData): Promise<boolean> {
    try {
      await submitReferral({
        txHash: referralData.txHash,
        chainId: referralData.chainId,
      });
      console.log('Referral submitted successfully:', referralData.txHash);
      return true;
    } catch (error) {
      console.error('Error submitting referral:', error);
      return false;
    }
  }

  // Validate if Divvi is configured properly
  static isConfigured(): boolean {
    return DIVVI_CONSUMER_ID.startsWith('0x') && DIVVI_CONSUMER_ID.length === 42;
  }
}