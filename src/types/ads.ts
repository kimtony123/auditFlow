export type AdType = 'PPV' | 'PPC'; // Pay Per View vs Pay Per Click
export type UserType = 'Free' | 'Premium';

export interface Ad {
  id: string;
  title: string;
  description: string;
  target_url: string;
  image_url: string;
  ad_type: AdType;
  remaining_views?: number;
  static_weight?: number;
  status?: 'active' | 'completed';
}

export interface RenderAdResponse {
  ad_title: string;
  ad_description: string;
  ad_target_url: string;
  ad_image_url: string;
  ad_type: AdType;
  ad_id: string;
}

export interface RecordAdViewParams {
  appId: string;
  ad_id: string;
  ad_type: AdType;
  user_address: string;
}