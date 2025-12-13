// src/utils/tierUsageHelpers.ts
import type { UserTier } from '../context/UserTypeContext';

export interface TierLimits {
  summaries: number | 'Unlimited';
  reports: number | 'Unlimited';
  requiredStake: number | 'Unlimited';
  minStakeDuration: number;
}

export interface UserUsage {
  totalAnalyses: number;
  analysesThisMonth: number;
  analysesRemaining: number;
  lastAnalysisDate: string | null;
}

export interface TierCheckResult {
  canPerformAction: boolean;
  reason: string | null;
  remaining: number;
  limit: number | 'Unlimited';
}

export const getTierLimits = (tier: UserTier): TierLimits => {
  switch (tier) {
    case 'basic':
      return { summaries: 5, reports: 1, requiredStake: 0, minStakeDuration: 0 };
    case 'premium':
      return { summaries: 15, reports: 10, requiredStake: 100, minStakeDuration: 30 };
    case 'pro':
      return { summaries: 100, reports: 40, requiredStake: 500, minStakeDuration: 30 };
    case 'enterprise':
      return { summaries: 'Unlimited', reports: 'Unlimited', requiredStake: 1000, minStakeDuration: 90 };
    case 'guest':
      return { summaries: 0, reports: 0, requiredStake: 0, minStakeDuration: 0 };
    default:
      return { summaries: 0, reports: 0, requiredStake: 0, minStakeDuration: 0 };
  }
};

export const canPerformAnalysis = (
  userTier: UserTier,
  currentUsage: { analysesThisMonth: number; analysesRemaining: number }
): TierCheckResult => {
  const limits = getTierLimits(userTier);
  
  if (limits.reports === 'Unlimited') {
    return {
      canPerformAction: true,
      reason: null,
      remaining: Infinity,
      limit: 'Unlimited'
    };
  }
  
  const remaining = Math.max(0, limits.reports - currentUsage.analysesThisMonth);
  
  if (remaining <= 0) {
    return {
      canPerformAction: false,
      reason: `You've reached your monthly limit of ${limits.reports} analyses. Stake more tokens to upgrade your tier.`,
      remaining: 0,
      limit: limits.reports
    };
  }
  
  return {
    canPerformAction: true,
    reason: null,
    remaining,
    limit: limits.reports
  };
};

export const canStakeForTier = (
  currentTier: UserTier,
  targetTier: UserTier,
  currentStakedAmount: number,
  walletBalance: number
): TierCheckResult => {
  const currentLimits = getTierLimits(currentTier);
  const targetLimits = getTierLimits(targetTier);
  
  if (targetLimits.requiredStake === 'Unlimited') {
    return {
      canPerformAction: walletBalance >= 1000, // Minimum for enterprise
      reason: walletBalance < 1000 ? `You need at least 1000 LTT tokens to stake for Enterprise tier` : null,
      remaining: walletBalance,
      limit: 1000
    };
  }
  
  const requiredAdditionalStake = Math.max(0, 
    Number(targetLimits.requiredStake) - currentStakedAmount
  );
  
  if (requiredAdditionalStake === 0) {
    return {
      canPerformAction: true,
      reason: null,
      remaining: 0,
      limit: targetLimits.requiredStake
    };
  }
  
  if (walletBalance < requiredAdditionalStake) {
    return {
      canPerformAction: false,
      reason: `You need ${requiredAdditionalStake} LTT tokens to stake for ${targetTier} tier. You have ${walletBalance} LTT.`,
      remaining: walletBalance,
      limit: targetLimits.requiredStake
    };
  }
  
  return {
    canPerformAction: true,
    reason: null,
    remaining: walletBalance,
    limit: targetLimits.requiredStake
  };
};

export const calculateRequiredStake = (
  targetTier: UserTier,
  duration: number
): number => {
  const baseStake = getTierLimits(targetTier).requiredStake;
  
  if (baseStake === 'Unlimited') return 1000; // Default for enterprise
  
  // Adjust stake based on duration (longer duration = less stake required)
  const baseAmount = Number(baseStake);
  const maxDuration = 365;
  const minDuration = getTierLimits(targetTier).minStakeDuration;
  
  if (duration < minDuration) {
    // Penalty for shorter duration
    return baseAmount * (1 + (minDuration - duration) / minDuration);
  }
  
  if (duration > maxDuration) {
    // Bonus for longer duration
    return baseAmount * 0.8; // 20% discount for max duration
  }
  
  // Linear interpolation
  const ratio = (maxDuration - duration) / (maxDuration - minDuration);
  return baseAmount * (0.8 + 0.2 * ratio); // Between 80-100% of base stake
};

export const getTierFromStake = (stakedAmount: number, stakingDuration: number): UserTier => {
  if (stakedAmount >= 1000 && stakingDuration >= 90) return 'enterprise';
  if (stakedAmount >= 500 && stakingDuration >= 30) return 'pro';
  if (stakedAmount >= 100 && stakingDuration >= 30) return 'premium';
  if (stakedAmount > 0) return 'basic';
  return 'guest';
};

export const decrementUsage = (
  currentUsage: UserUsage,
  actionType: 'summary' | 'report'
): UserUsage => {
  const newUsage = { ...currentUsage };
  
  if (actionType === 'summary') {
    newUsage.totalAnalyses += 1;
    newUsage.analysesThisMonth += 1;
    if (newUsage.analysesRemaining > 0) {
      newUsage.analysesRemaining -= 1;
    }
  } else if (actionType === 'report') {
    // Reports might have different limits
    newUsage.totalAnalyses += 1;
    newUsage.analysesThisMonth += 1;
    if (newUsage.analysesRemaining > 0) {
      newUsage.analysesRemaining -= 1;
    }
  }
  
  newUsage.lastAnalysisDate = new Date().toISOString();
  return newUsage;
};