import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';
import type { Ad, RenderAdResponse, RecordAdViewParams, UserType, AdType } from '../types/ads';

export class AdsService {
  private static processId = process.env.ADS_PROCESS_ID; // Set this in your config

  /**
   * Render an ad for free users
   */
  static async renderAd(appId: string, publisherId: string, userType: UserType): Promise<Ad | null> {
    // Only free users see ads
    if (userType !== 'Free') {
      return null;
    }

    const tags = AOService.createTags("RenderAd", {
      appId,
      publisher_id: publisherId,
      userType,
      Data: DataEncoder.encode({
        appId,
        publisher_id: publisherId,
        userType
      })
    });

    try {
      const response = await AOService.sendMessage({
        process: this.processId!,
        tags
      });

      if (response.code === 200) {
        const adData: RenderAdResponse = response.data;
        
        // Convert the response to our Ad interface
        return {
          id: adData.ad_id,
          title: adData.ad_title,
          description: adData.ad_description,
          target_url: adData.ad_target_url,
          image_url: adData.ad_image_url,
          ad_type: adData.ad_type
        };
      } else {
        console.warn('No ad available or user is not free:', response.data?.message);
        return null;
      }
    } catch (error) {
      console.error('Error rendering ad:', error);
      return null; // Return null instead of throwing to avoid breaking the app
    }
  }

  /**
   * Record ad view (for PPV) or click (for PPC)
   */
  static async recordAdInteraction(params: RecordAdViewParams): Promise<boolean> {
    const tags = AOService.createTags("RecordAdView", {
      appId: params.appId,
      ad_id: params.ad_id,
      ad_type: params.ad_type,
      user_address: params.user_address,
      Data: DataEncoder.encode({
        appId: params.appId,
        ad_id: params.ad_id,
        ad_type: params.ad_type,
        user_address: params.user_address
      })
    });

    try {
      const response = await AOService.sendMessage({
        process: this.processId!,
        tags
      });

      return response.code === 200;
    } catch (error) {
      console.error('Error recording ad interaction:', error);
      return false;
    }
  }

  /**
   * Handle ad click with proper redirect and PPC recording
   */
  static async handleAdClick(ad: Ad, appId: string, userAddress: string): Promise<void> {
    // For PPC ads, record the click before redirecting
    if (ad.ad_type === 'PPC') {
      try {
        await this.recordAdInteraction({
          appId,
          ad_id: ad.id,
          ad_type: ad.ad_type,
          user_address: userAddress
        });
      } catch (error) {
        console.error('Failed to record PPC click:', error);
        // Continue with redirect even if recording fails
      }
    }

    // Redirect to target URL
    window.open(ad.target_url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Record PPV ad view (call this when ad is displayed)
   */
  static async recordAdView(ad: Ad, appId: string, userAddress: string): Promise<void> {
    if (ad.ad_type === 'PPV') {
      try {
        await this.recordAdInteraction({
          appId,
          ad_id: ad.id,
          ad_type: ad.ad_type,
          user_address: userAddress
        });
      } catch (error) {
        console.error('Failed to record PPV view:', error);
      }
    }
  }
}