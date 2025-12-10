import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useNavigation } from '../../../../hooks/useNavigation';
import type { SubscriptionPlan, SubscriptionPaymentParams } from '../../../../types/subscription';
import { type TokenInfo } from '../../../../types/tokens';
import './subscriptionInfoPage.css';

const SubscriptionInfoReferralPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { 
    subscribeToPlan, 
    getPlan, 
    extractReferralInfo, 
    calculateReferralInfo,
    availableTokens,
    selectedToken,
    selectToken,
    transferAmount,
    feeBreakdown,
    isCalculating,
    isLoading 
  } = useSubscription();
  
  const handleClick = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get URL parameters using React Router
  const subId = searchParams.get('subId');
  const dappId = searchParams.get('dappId');
  const planName = searchParams.get('planName');
  const price = parseFloat(searchParams.get('price') || '0');
  const tier = searchParams.get('tier');
  
  const { referrerId, hasReferral } = extractReferralInfo(searchParams);
  const referralInfo = calculateReferralInfo(price, hasReferral);
  
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [currentDapp, setCurrentDapp] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (dappId && subId) {
      loadPlanAndDapp();
    } else {
      setLoadError('Missing required parameters: dappId or subId');
    }
  }, [dappId, subId]);

  useEffect(() => {
    // Auto-calculate payment when token or plan changes
    if (selectedToken && currentPlan) {
      selectToken(selectedToken, currentPlan.price, hasReferral);
    }
  }, [selectedToken, currentPlan, selectToken, hasReferral]);

  const loadPlanAndDapp = async () => {
    if (!dappId || !subId) {
      setLoadError('Missing DApp ID or Subscription ID');
      return;
    }

    try {
      const plan = await getPlan(dappId, subId);
      if (plan) {
        setCurrentPlan(plan);
      } else {
        setLoadError('Plan not found');
      }
      // Load DApp details here if needed...
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load plan';
      setLoadError(message);
    }
  };

  const handleTokenSelect = async (token: TokenInfo) => {
    if (!currentPlan) return;
    await selectToken(token, currentPlan.price, hasReferral);
  };

  const handleBackToSubscriptions = () => {
    navigate(`/dappSubscriptions?id=${dappId}`);
  };

  const handleGoToRegularSubscription = () => {
    navigate(`/subscriptionInfo?dappId=${dappId}&subId=${subId}`);
  };

  const handleSubscribe = async () => {
    if (!dappId || !subId || !selectedToken || !transferAmount || !currentPlan || !referrerId) return;
    
    setIsProcessing(true);
    try {
      const params: SubscriptionPaymentParams & { usdAmount: number } = {
        dapp_id: dappId,
        plan_id: subId,
        payment_token: selectedToken.tokenId,
        referrer_id: referrerId,
        usdAmount: currentPlan.price
      };
      
      const result = await subscribeToPlan(params);
      if (result.success) {
        alert(`Subscription successful! Your friend earned ${referralInfo.referral_bonus} ${selectedToken.symbol} referral bonus.`);
        handleClick('/mySubscriptions')();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert('Subscription failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadError) {
    return (
      <div className="subscription-referral-page">
        <div className="container">
          <div className="card error-card">
            <h2>Error Loading Plan</h2>
            <p>{loadError}</p>
            <button onClick={handleBackToSubscriptions} className="back-button">
              ← Back to Subscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPlan || isLoading) {
    return (
      <div className="subscription-referral-page">
        <div className="container">
          <div className="card">
            <div className="loading">Loading plan details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-referral-page">
      <div className="container">
        <div className="card">
          <button onClick={handleBackToSubscriptions} className="back-button">
            ← Back to Subscriptions
          </button>
        </div>
      </div>

      {/* Referral Banner */}
      <div className="referral-banner">
        <div className="banner-content">
          <span className="banner-icon">🎉</span>
          <div>
            <h3>Referred by a Friend!</h3>
            <p>You're supporting both the developer and your friend with this subscription.</p>
            {referrerId && (
              <p className="referrer-id">Referred by: {referrerId.substring(0, 8)}...{referrerId.substring(referrerId.length - 8)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <h1>{currentPlan.plan_name}</h1>
          <p>{currentPlan.description}</p>
          <div className="price-tag">
            {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/${currentPlan.billing_period}`}
          </div>

          {/* Token Selection */}
          <div className="payment-section">
            <h3>Select Payment Token</h3>
            <div className="token-grid">
              {availableTokens.map((token: TokenInfo) => (
                <div
                  key={token.tokenId}
                  className={`token-option ${selectedToken?.tokenId === token.tokenId ? 'selected' : ''}`}
                  onClick={() => handleTokenSelect(token)}
                >
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-type">{token.type}</div>
                  {isCalculating && selectedToken?.tokenId === token.tokenId && (
                    <div className="calculating">Calculating...</div>
                  )}
                </div>
              ))}
            </div>

            {/* Transfer Amount Display */}
            {transferAmount && (
              <div className="transfer-details">
                <h4>Payment Details</h4>
                <div className="detail-row">
                  <span>You will pay:</span>
                  <span className="amount">
                    {transferAmount.amount.toFixed(6)} {transferAmount.symbol}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Value:</span>
                  <span>${transferAmount.usdValue.toFixed(2)} USD</span>
                </div>
                
                {/* Fee Breakdown with Referral */}
                {feeBreakdown && (
                  <div className="fee-breakdown">
                    <h4>Fee Structure (With Referral)</h4>
                    <div className="fee-item">
                      <span>Developer Share:</span>
                      <span>{feeBreakdown.rewards_amount.toFixed(6)} {transferAmount.symbol}</span>
                    </div>
                    <div className="fee-item">
                      <span>Platform Fee:</span>
                      <span>{feeBreakdown.stakers_fee.toFixed(6)} {transferAmount.symbol}</span>
                    </div>
                    {feeBreakdown.treasury_fee > 0 && (
                      <div className="fee-item">
                        <span>Treasury:</span>
                        <span>{feeBreakdown.treasury_fee.toFixed(6)} {transferAmount.symbol}</span>
                      </div>
                    )}
                    <div className="fee-item">
                      <span>Marketing:</span>
                      <span>{feeBreakdown.marketing_fee.toFixed(6)} {transferAmount.symbol}</span>
                    </div>
                    <div className="fee-item highlight">
                      <span>Referrer Bonus:</span>
                      <span>{referralInfo.referral_bonus.toFixed(6)} {transferAmount.symbol}</span>
                    </div>
                  </div>
                )}

                <div className="payment-summary">
                  <div className="summary-item">
                    <span>Your Friend Earns:</span>
                    <span className="highlight">{referralInfo.referral_bonus.toFixed(6)} {transferAmount.symbol}</span>
                  </div>
                  <div className="summary-item">
                    <span>You Save:</span>
                    <span className="highlight">{referralInfo.discount_amount.toFixed(6)} {transferAmount.symbol}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          className="subscribe-btn"
          onClick={handleSubscribe}
          disabled={isProcessing || !selectedToken || !transferAmount || isCalculating || !referrerId}
        >
          {isProcessing ? 'Processing...' : 
           isCalculating ? 'Calculating...' : 
           `Subscribe & Support Friend - ${transferAmount ? transferAmount.amount.toFixed(6) + ' ' + transferAmount.symbol : 'Select Token'}`}
        </button>

        {!referrerId && (
          <div className="card warning">
            <h3>Missing Referral Information</h3>
            <p>This page is intended for referral subscriptions, but no referrer was found.</p>
            <button onClick={handleGoToRegularSubscription} className="alternative-link">
              Go to regular subscription page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionInfoReferralPage;