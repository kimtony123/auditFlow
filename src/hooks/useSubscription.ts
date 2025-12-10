import { useState, useCallback, useEffect } from 'react';
import { useConnection , useActiveAddress } from '@arweave-wallet-kit/react';
import { SubscriptionService } from '../services/subsciptionService';
import { TokenService } from '../services/tokenService';
import type {
  SubscriptionPlan,
  UserSubscription,
  DAppSubscriptionsResponse,
  SubscriptionPaymentParams,
  ReferralInfo
} from '../types/subscription';
import { type TokenInfo, type TransferAmount } from '../types/tokens';

export const useSubscription = (dappId?: string) => {
  const { connected } = useConnection();

  const address = useActiveAddress();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<DAppSubscriptionsResponse | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [transferAmount, setTransferAmount] = useState<TransferAmount | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize available tokens
  useEffect(() => {
    setAvailableTokens(TokenService.getAvailableTokens());
    // Auto-select first token
    const tokens = TokenService.getAvailableTokens();
    if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  }, []);

  // Fetch all subscription data for a DApp
  const fetchSubscriptionData = useCallback(async (targetDappId: string) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await SubscriptionService.fetchDAppSubscriptions(targetDappId);
      setSubscriptionData(data);
      
      const isPremium = await SubscriptionService.hasPremiumSubscription(targetDappId);
      setHasPremium(isPremium);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Get specific plan by DApp ID and Subscription ID
  const getPlan = useCallback(async (targetDappId: string, subId: string): Promise<SubscriptionPlan | null> => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      // If we already have the subscription data for this DApp, use it
      if (subscriptionData && subscriptionData.dapp_id === targetDappId) {
        const plan = subscriptionData.subscriptions.find(plan => plan.id === subId);
        return plan || null;
      }
      
      // Otherwise fetch fresh data
      const data = await SubscriptionService.fetchDAppSubscriptions(targetDappId);
      const plan = data.subscriptions.find(plan => plan.id === subId);
      return plan || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected, subscriptionData]);

  // Calculate payment details when token or plan changes
  const calculatePaymentDetails = useCallback(async (usdAmount: number, tokenId: string, hasReferral: boolean = false) => {
    if (!tokenId || !usdAmount) return;

    setIsCalculating(true);
    try {
      const paymentDetails = await SubscriptionService.calculatePaymentDetails(usdAmount, tokenId, hasReferral);
      // Ensure the transferAmount stored in state conforms to the TransferAmount type
      const transfer: TransferAmount = {
        // preserve any existing fields from the service result (like amount)
        ...paymentDetails.transferAmount,
        // add required fields expected by the state type
        tokenId,
        usdValue: usdAmount,
        type: 'other'
      };
      setTransferAmount(transfer);
      setFeeBreakdown(paymentDetails.feeBreakdown);
      return paymentDetails;
    } catch (err) {
      console.error('Error calculating payment details:', err);
      setError('Failed to calculate payment amount');
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Subscribe to a plan with token transfer
  const subscribeToPlan = useCallback(async (params: SubscriptionPaymentParams & { usdAmount: number }) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      // First calculate the transfer amount
      const paymentDetails = await calculatePaymentDetails(
        params.usdAmount, 
        params.payment_token, 
        !!params.referrer_id
      );

      if (!paymentDetails) {
        throw new Error('Failed to calculate payment amount');
      }

      // Then subscribe with the calculated transfer amount
      const result = await SubscriptionService.subscribeToPlan({
        ...params,
        transferAmount: paymentDetails.transferAmount.amount
      });
      
      // Refresh subscription data after successful subscription
      if (result.success) {
        await fetchSubscriptionData(params.dapp_id);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to plan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected, fetchSubscriptionData, calculatePaymentDetails]);

  // Select token and auto-calculate payment
  const selectToken = useCallback(async (token: TokenInfo, usdAmount: number, hasReferral: boolean = false) => {
    setSelectedToken(token);
    await calculatePaymentDetails(usdAmount, token.tokenId, hasReferral);
  }, [calculatePaymentDetails]);

  // Auto-fetch when dappId changes
  useEffect(() => {
    if (dappId && connected) {
      fetchSubscriptionData(dappId);
    }
  }, [dappId, connected, fetchSubscriptionData]);

  return {
    // Data
    subscriptionData,
    plans: subscriptionData?.subscriptions || [],
    userSubscription: subscriptionData?.user_subscription || null,
    hasPremium,
    availableTokens,
    selectedToken,
    transferAmount,
    feeBreakdown,
    
    // Actions
    fetchSubscriptionData,
    subscribeToPlan,
    selectToken,
    calculatePaymentDetails,
    getPlan, // Added getPlan function
    
    // Utility functions
    generateReferralUrl: SubscriptionService.generateReferralUrl,
    extractReferralInfo: SubscriptionService.extractReferralInfo,
    calculateReferralInfo: SubscriptionService.calculateReferralInfo,
    
    // State
    isLoading,
    isCalculating,
    error,
    clearError: () => setError(null)
  };
};