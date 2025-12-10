export interface SubscriptionPlan {
  id: string;
  plan_id: string;
  plan_name: string;
  tier: 'free' | 'premium' | 'pro' | 'enterprise';
  price: number;
  billing_period: 'month' | 'year' | 'lifetime';
  features: string[];
  description: string;
  created_at: number;
}

export interface UserSubscription {
  plan_id: string;
  tier: string;
  status: 'active' | 'canceled' | 'expired';
  start_date: number;
  end_date?: number;
  auto_renew: boolean;
  payment_token?: string;
  amount_paid?: number;
}

export interface DAppSubscriptionsResponse {
  dapp_id: string;
  subscriptions: SubscriptionPlan[];
  user_subscription: UserSubscription | null;
}

export interface SubscriptionPaymentParams {
  dapp_id: string;
  plan_id: string;
  payment_token: string;
  referrer_id?: string;
}

export interface ReferralInfo {
  discount_amount: any;
  referrer_id: string;
  referral_bonus: number;
  has_referral: boolean;
}

export interface TransferAmount {
  token_id: string;
  amount: number;
  currency: string;
  symbol: string;
}

export interface CalculatePaymentResponse {
  transferAmount: TransferAmount;
  referralBonusAmount?: number;
}

export interface SubscriptionResult {
  success: boolean;
  message?: string;
}

export interface SubscriptionData {
  subscriptions: SubscriptionPlan[];
  user_subscription: UserSubscription | null;
}

export interface ReferralCalculation {
  referrer_id: string;
  referral_bonus: number;
  has_referral: boolean;
}
