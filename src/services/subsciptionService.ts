import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';
import type {
  SubscriptionPlan,
  UserSubscription,
  DAppSubscriptionsResponse,
  SubscriptionPaymentParams,
  ReferralInfo,
  TransferAmount
} from '../types/subscription';
import { TokenService } from './tokenService';

import { SUBSCRIPTION_PROCESS_ID } from '../config/ao';

export class SubscriptionService {
  private static processId = SUBSCRIPTION_PROCESS_ID;

  /**
   * Fetch all subscription plans for a specific DApp
   * This matches the GetDappSubscriptions handler
   */
  static async fetchDAppSubscriptions(dappId: string): Promise<DAppSubscriptionsResponse> {
    const tags = AOService.createTags("GetDappSubscriptions", {
      dappId,
      Data: DataEncoder.encode({ dappId })
    });

    const response = await AOService.sendMessage({
      process: this.processId,
      tags
    });

    if (response.code === 200) {
      return {
        dapp_id: response.data?.dapp_id || dappId,
        subscriptions: response.data.subscriptions || [],
        user_subscription: response.data.user_subscription || null
      };
    } else {
      throw new Error(response.data?.message || "Failed to fetch DApp subscriptions");
    }
  }

  /**
   * Calculate payment details with token prices
   */
  static async calculatePaymentDetails(usdAmount: number, tokenId: string, hasReferral: boolean = false): Promise<{
    transferAmount: TransferAmount;
    feeBreakdown: any;
  }> {
    // Calculate transfer amount in tokens (TokenService may return a different shape)
    const tokenTransfer = await TokenService.calculateTransferAmount(usdAmount, tokenId);
    
    // Map TokenService result to subscription TransferAmount shape (requires token_id)
    const transferAmount: TransferAmount = {
      token_id: tokenId,
      amount: tokenTransfer.amount,
      currency: '',
      symbol: ''
    };

    // Calculate fee breakdown based on token type (use tokenTransfer.type if available)
    const feeBreakdown = TokenService.calculateFeeBreakdown(
      tokenTransfer.amount, 
      (tokenTransfer as any).type || tokenId, 
      hasReferral
    );

    return {
      transferAmount,
      feeBreakdown
    };
  }

  /**
   * Subscribe to a DApp plan with proper token transfer
   */
  static async subscribeToPlan(params: SubscriptionPaymentParams & { transferAmount: number }): Promise<{ success: boolean; message: string }> {
    const tags = AOService.createTags("SubscribePayment", {
      business_id: params.dapp_id,
      subscription_id: params.plan_id,
      payment_token: params.payment_token,
      transfer_amount: params.transferAmount.toString(),
      ...(params.referrer_id && { referrer_id: params.referrer_id }),
      Data: DataEncoder.encode({
        business_id: params.dapp_id,
        subscription_id: params.plan_id,
        payment_token: params.payment_token,
        transfer_amount: params.transferAmount,
        ...(params.referrer_id && { referrer_id: params.referrer_id })
      })
    });

    const response = await AOService.sendMessage({
      process: this.processId,
      tags
    });

    if (response.code === 200) {
      return {
        success: true,
        message: response.data.message || "Successfully subscribed!"
      };
    } else {
      throw new Error(response.data?.message || "Failed to subscribe to plan");
    }
  }

  /**
   * Execute token transfer (this would interface with your wallet)
   */
  static async executeTokenTransfer(transferAmount: TransferAmount, recipient: string): Promise<boolean> {
    // This would interface with arweave-wallet-kit or similar
    // For now, we'll assume the transfer happens in the AO process
    console.log(`Transferring ${transferAmount.amount} ${transferAmount.symbol} to ${recipient}`);
    
    // In a real implementation, you would:
    // 1. Get the user's wallet
    // 2. Create and sign the transaction
    // 3. Send the transaction
    // 4. Wait for confirmation
    
    return true; // Mock success
  }

  /**
   * Check if user has active premium subscription (no ads)
   */
  static async hasPremiumSubscription(dappId: string): Promise<boolean> {
    try {
      const subscriptionData = await this.fetchDAppSubscriptions(dappId);
      const userSubscription = subscriptionData.user_subscription;
      
      // If user_subscription is null, user is on free tier
      if (!userSubscription) {
        return false;
      }

      // User has subscription, check if it's premium (not free) and active
      return userSubscription.tier !== 'free' && userSubscription.status === 'active';
    } catch (error) {
      console.error('Error checking premium subscription:', error);
      return false; // Default to free on error
    }
  }

  /**
   * Get user's current subscription for a DApp
   */
  static async getUserSubscription(dappId: string): Promise<UserSubscription | null> {
    try {
      const subscriptionData = await this.fetchDAppSubscriptions(dappId);
      return subscriptionData.user_subscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Get specific plan by ID
   */
  static async getPlanById(dappId: string, planId: string): Promise<SubscriptionPlan | null> {
    try {
      const subscriptionData = await this.fetchDAppSubscriptions(dappId);
      return subscriptionData.subscriptions.find(plan => plan.plan_id === planId) || null;
    } catch (error) {
      console.error('Error fetching plan:', error);
      return null;
    }
  }

  /**
   * Calculate referral info for a subscription
   */
  static calculateReferralInfo(planPrice: number, hasReferral: boolean): ReferralInfo {
    const referralBonus = hasReferral ? planPrice * 0.02 : 0; // 2% referral bonus
    
    return {
  has_referral: hasReferral,
  referrer_id: '', // This will be set from URL params
  referral_bonus: referralBonus,
  discount_amount: undefined
};
  }

  /**
   * Generate referral URL
   */
  static generateReferralUrl(baseUrl: string, params: {
    subId: string;
    dappId: string;
    planName: string;
    price: number;
    tier: string;
    referrerId: string;
  }): string {
    const urlParams = new URLSearchParams({
      subId: params.subId,
      dappId: params.dappId,
      planName: params.planName,
      price: params.price.toString(),
      tier: params.tier,
      ref: params.referrerId
    });
    
    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Extract referral info from URL
   */
  static extractReferralInfo(urlParams: URLSearchParams): { referrerId: string | null; hasReferral: boolean } {
    const referrerId = urlParams.get('ref');
    return {
      referrerId,
      hasReferral: !!referrerId
    };
  }


}