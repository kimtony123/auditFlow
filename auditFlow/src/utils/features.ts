// types/features.ts
export type FeatureType = 
  | 'code_summaries' 
  | 'ai_reports' 
  | 'team_members' 
  | 'priority_support'
  | 'white_label'
  | 'api_access'
  | 'custom_integrations'
  | 'dedicated_support'
  | 'sla'
  | 'unlimited_summaries'
  | 'unlimited_reports';

export interface Feature {
  id: number;
  name: string;
  description: string;
  type: FeatureType;
  limit?: number; // Number of uses per month (undefined = unlimited)
}

export interface TierFeatures {
  id: number;
  name: string;
  description: string;
  minStake: number; // LTT tokens
  maxStake: number; // LTT tokens
  minDuration: number; // days
  maxDuration: number; // days
  apy: number; // Annual percentage yield
  features: Feature[];
}

export interface UserFeatureUsage {
  featureId: number;
  type: FeatureType;
  used: number;
  limit: number;
  remaining: number;
  resetDate: string; // When the usage resets (e.g., end of month)
}