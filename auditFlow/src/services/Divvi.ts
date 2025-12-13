import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

// Your Divvi Identifier - keep this in environment variables
const DIVVI_CONSUMER_ID: `0x${string}` = '0xC436Ebb132fb4E39F25a044ded4B8052ab26CD6f';

export interface ReferralData {
  txHash: `0x${string}`;
  chainId: number;
  userAddress: `0x${string}`;
}

export class DivviService {
  // Generate referral tag for a user
  static generateReferralTag(userAddress: `0x${string}`): string {
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

  // Helper to ensure address has 0x prefix
  static ensureHexPrefix(address: string): `0x${string}` {
    if (address.startsWith('0x')) {
      return address as `0x${string}`;
    }
    return `0x${address}`;
  }

  // Helper to generate referral tag from any address string
  static generateReferralTagFromString(userAddress: string): string {
    try {
      const formattedAddress = this.ensureHexPrefix(userAddress);
      return this.generateReferralTag(formattedAddress);
    } catch (error) {
      console.error('Error generating referral tag from string:', error);
      return '';
    }
  }

  // Helper to submit referral with string inputs
  static async submitReferralFromStrings(
    txHash: string,
    chainId: number,
    userAddress: string
  ): Promise<boolean> {
    const referralData: ReferralData = {
      txHash: this.ensureHexPrefix(txHash),
      chainId,
      userAddress: this.ensureHexPrefix(userAddress),
    };
    return this.submitReferral(referralData);
  }
}