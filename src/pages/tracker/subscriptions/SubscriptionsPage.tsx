import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../hooks/useSubscription';
import { useNavigation } from '../../../hooks/useNavigation';
import type { SubscriptionPlan } from '../../../types/subscription';
import './SubscriptionsPage.css';

const SubscriptionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dappId = searchParams.get('id'); // Get dappId from URL
  
  const { 
    subscriptionData, 
    plans, 
    userSubscription, 
    isLoading,
    generateReferralUrl 
  } = useSubscription(dappId || '');
  const handleClick = useNavigation();
  const [currentDapp, setCurrentDapp] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (dappId) {
      loadDappDetails();
    } else {
      setLoadError('No DApp ID provided in URL');
    }
  }, [dappId]);

  const loadDappDetails = async () => {
    if (!dappId) return;
    
    try {
      // Implement DApp details loading
      // This would fetch from your GetDappDetails handler
      // setCurrentDapp(await loadDappDetails(dappId));
    } catch (error) {
      setLoadError('Failed to load DApp details');
    }
  };

  const isUserSubscribed = (planId: React.Key | null | undefined): boolean => {
    return userSubscription?.plan_id === planId;
  };

  const getSubscriptionInfoUrl = (plan: Partial<SubscriptionPlan>, isReferral: boolean = false): string => {
    if (!dappId) return '#';
    
    const basePath = isReferral ? '/subscriptionInfoReferral' : '/subscriptionInfo';
    
    return generateReferralUrl(basePath, {
      subId: String(plan.plan_id),
      dappId,
      planName: String(plan.plan_name),
      price: plan.price ?? 0,
      tier: plan.tier ?? '',
      referrerId: 'current-user-address'
    });
  };

  const handleBackToDapp = () => {
    navigate(`/dappInfo?id=${dappId}`);
  };

  const handleTabNavigation = (path: string) => {
    navigate(`${path}?id=${dappId}`);
  };

  // Handle missing dappId
  if (!dappId) {
    return (
      <div className="subscriptions-page">
        <div className="container">
          <div className="card error-card">
            <h2>Error: No DApp ID Provided</h2>
            <p>Please provide a valid DApp ID in the URL.</p>
            <button onClick={() => navigate('/')} className="back-button">
              ← Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="subscriptions-page">
        <div className="container">
          <div className="card error-card">
            <h2>Error Loading DApp</h2>
            <p>{loadError}</p>
            <button onClick={() => navigate(-1)} className="back-button">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="subscriptions-page">
        <div className="loading">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page">
      <nav className="subscriptions-nav">
        <div className="nav-container">
          <button onClick={() => navigate('/')} className="brand">aoStore</button>
          <div className="nav-links">
            <button onClick={() => navigate('/')}>Home</button>
            <button onClick={() => navigate('/projects')}>Projects</button>
            <button onClick={() => navigate('/dapps')}>Dapps</button>
            <button onClick={() => navigate('/ads')}>Ads</button>
            <button className="active">Subscriptions</button>
            <button onClick={() => navigate('/staking')}>Staking</button>
            <button onClick={() => navigate('/treasury')}>Treasury</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <button onClick={handleBackToDapp} className="back-button">
            ← Back to DApp
          </button>
        </div>

        {/* DApp Header */}
        <div className="card">
          <div className="project-grid">
            <img 
              src={currentDapp?.logo_url} 
              alt="DApp Logo" 
              className="project-image"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiPgo8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjE2IiBmaWxsPSIjNDI4NUY0Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RDwvdGV4dD4KPC9zdmc+';
              }}
            />
            <div className="dapp-info">
              <h1>{currentDapp?.name || 'DApp'}</h1>
              <p>{currentDapp?.description || 'Loading description...'}</p>
              <div className="dapp-meta">
                <span className="category-badge">{currentDapp?.main_category || 'Uncategorized'}</span>
                <span className="category-badge primary">DApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Content */}
        <div className="card tab-container">
          <div className="tab-nav">
            <button 
              onClick={() => handleTabNavigation('/dappInfo')} 
              className="tab-button"
            >
              Details
            </button>
            <button 
              onClick={() => handleTabNavigation('/dappReviews')} 
              className="tab-button"
            >
              Reviews
            </button>
            <button className="tab-button active">Subscriptions</button>
          </div>

          <div className="tab-content">
            <div className="subscriptions-header">
              <h1>DApp Subscriptions</h1>
              <p>Choose a subscription plan to unlock premium features for this DApp</p>
            </div>

            {/* Subscriptions Grid */}
            <div className="subscriptions-grid">
              {plans.length === 0 ? (
                <div className="no-subscriptions">
                  <h3>No Subscription Plans Available</h3>
                  <p>This DApp doesn't have any subscription plans yet.</p>
                </div>
              ) : (
                plans.map((plan: any) => (
                  <div key={plan.plan_id} className="subscription-card">
                    <div className="subscription-header">
                      <h3 className="subscription-name">
                        <span className={`tier-badge ${plan.tier}`}>
                          {plan.tier.toUpperCase()}
                        </span>
                        {plan.plan_name}
                      </h3>
                      <div className="subscription-price">
                        {plan.price === 0 ? (
                          <span className="free-badge">Free</span>
                        ) : (
                          <>
                            <span className="price">${plan.price}</span>
                            <span className="period">/{plan.billing_period}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="subscription-description">
                      {plan.description || 'Premium features and benefits'}
                    </p>

                    <ul className="subscription-features">
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feature: string, index: number) => (
                          <li key={index} className="subscription-feature">
                            <span className="feature-check">✓</span>
                            {feature}
                          </li>
                        ))
                      ) : (
                        <li className="subscription-feature">No features listed</li>
                      )}
                    </ul>

                    <div className="subscription-actions">
                      {isUserSubscribed(plan.plan_id) ? (
                        <button className="btn-subscribed" disabled>
                          Subscribed
                        </button>
                      ) : (
                        <a 
                          href={getSubscriptionInfoUrl({ 
                            ...plan, 
                            plan_id: plan.plan_id == null ? undefined : String(plan.plan_id),
                            plan_name: plan.plan_name == null ? undefined : String(plan.plan_name)
                          } as Partial<SubscriptionPlan>, false)}
                          className="btn-subscribe"
                        >
                          {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Benefits Section */}
            <div className="benefits-grid">
              <div className="benefit-card">
                <h3>Why Subscribe?</h3>
                <ul>
                  <li>Premium Features: Access exclusive features</li>
                  <li>Priority Support: Get faster responses</li>
                  <li>Early Access: Be the first to try new features</li>
                  <li>Ad-Free Experience: Enjoy without interruptions</li>
                </ul>
              </div>
              <div className="benefit-card">
                <h3>Payment Options</h3>
                <ul>
                  <li>Multiple Tokens: Pay with various cryptocurrencies</li>
                  <li>Auto-Renewal: Subscriptions automatically renew</li>
                  <li>Cancel Anytime: You can cancel at any time</li>
                  <li>Marketing Boost: 10% goes to promoting the DApp</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;