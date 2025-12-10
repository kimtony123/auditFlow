import React from 'react';
import { useAds } from '../../hooks/useAds';
import { useSubscription } from '../../hooks/useSubscription';
import './AdComponent.css';

interface AdComponentProps {
  appId: string;
  publisherId: string;
  placement?: 'banner' | 'sidebar' | 'inline';
}

export const AdComponent: React.FC<AdComponentProps> = ({ 
  appId, 
  publisherId, 
  placement = 'banner' 
}) => {
  // Get user subscription status to determine if they're free
  const { hasPremium, isLoading: subscriptionLoading } = useSubscription(appId);
  const userType = hasPremium ? 'Premium' : 'Free';
  
  const { 
    currentAd, 
    handleAdClick, 
    isLoading, 
    error,
    isPpcAd,
    isPpvAd
  } = useAds(appId, publisherId, userType);

  // Don't show ads for premium users
  if (hasPremium) {
    return null;
  }

  // Show loading state
  if (subscriptionLoading || isLoading) {
    return (
      <div className={`ad-container ad-${placement} ad-loading`}>
        <div className="ad-loading-spinner">Loading ad...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`ad-container ad-${placement} ad-error`}>
        <p>Ad temporarily unavailable</p>
      </div>
    );
  }

  // No ad available
  if (!currentAd) {
    return (
      <div className={`ad-container ad-${placement} ad-empty`}>
        <p>No ads available at the moment</p>
      </div>
    );
  }

  return (
    <div className={`ad-container ad-${placement}`}>
      <div 
        className="ad-content"
        onClick={() => handleAdClick(currentAd)}
        style={{ cursor: isPpcAd ? 'pointer' : 'default' }}
      >
        {/* Ad Badge */}
        <div className="ad-badge">
          {isPpcAd ? 'Ad - Click to visit' : 'Advertisement'}
        </div>
        
        {/* Ad Image */}
        {currentAd.image_url && (
          <div className="ad-image">
            <img 
              src={currentAd.image_url} 
              alt={currentAd.title}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Ad Text */}
        <div className="ad-text">
          <h4 className="ad-title">{currentAd.title}</h4>
          <p className="ad-description">{currentAd.description}</p>
        </div>
        
        {/* Ad Type Indicator */}
        <div className="ad-type-indicator">
          {isPpcAd ? '💵 Pay Per Click' : '👁️ Pay Per View'}
        </div>
      </div>
    </div>
  );
};