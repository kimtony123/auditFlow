import { useState, useCallback, useEffect } from 'react';
import { useConnection, useActiveAddress } from '@arweave-wallet-kit/react';
import { AdsService } from '../services/adsService';
import type { Ad, UserType } from '../types/ads';

export const useAds = (appId: string, publisherId: string, userType: UserType) => {
  const { connected } = useConnection();

    const address = useActiveAddress();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  // Fetch a new ad
  const fetchAd = useCallback(async () => {
    if (!connected || userType !== 'Free') {
      setCurrentAd(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasRecordedView(false);

    try {
      const ad = await AdsService.renderAd(appId, publisherId, userType);
      setCurrentAd(ad);
      return ad;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ad';
      setError(errorMessage);
      setCurrentAd(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected, appId, publisherId, userType]);

  // Record ad view (for PPV ads)
  const recordAdView = useCallback(async (ad: Ad) => {
    if (!address || !ad || ad.ad_type !== 'PPV' || hasRecordedView) {
      return;
    }

    try {
      await AdsService.recordAdView(ad, appId, address);
      setHasRecordedView(true);
    } catch (error) {
      console.error('Failed to record ad view:', error);
    }
  }, [address, appId, hasRecordedView]);

  // Handle ad click (for both PPV and PPC)
  const handleAdClick = useCallback(async (ad: Ad) => {
    if (!address || !ad) {
      return;
    }

    try {
      await AdsService.handleAdClick(ad, appId, address);
    } catch (error) {
      console.error('Error handling ad click:', error);
    }
  }, [address, appId]);

  // Auto-fetch ad when dependencies change
  useEffect(() => {
    if (connected && userType === 'Free') {
      fetchAd();
    } else {
      setCurrentAd(null);
    }
  }, [connected, userType, fetchAd]);

  // Auto-record view when PPV ad is displayed
  useEffect(() => {
    if (currentAd && currentAd.ad_type === 'PPV' && !hasRecordedView) {
      const timer = setTimeout(() => {
        recordAdView(currentAd);
      }, 1000); // Record view after 1 second (adjust as needed)

      return () => clearTimeout(timer);
    }
  }, [currentAd, hasRecordedView, recordAdView]);

  return {
    // Data
    currentAd,
    
    // Actions
    fetchAd,
    recordAdView,
    handleAdClick,
    
    // State
    isLoading,
    error,
    hasRecordedView,
    clearError: () => setError(null),
    
    // Derived state
    hasAd: !!currentAd,
    isPpcAd: currentAd?.ad_type === 'PPC',
    isPpvAd: currentAd?.ad_type === 'PPV'
  };
};