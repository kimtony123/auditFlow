import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useNavigation } from '../../../../hooks/useNavigation';
import { type SubscriptionPlan, type SubscriptionPaymentParams } from '../../../../types/subscription';
import { type TokenInfo } from '../../../../types/tokens';
import './subscriptionInfoPage.css';

const SubscriptionInfoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { 
    subscribeToPlan, 
    getPlan, 
    generateReferralUrl,
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
      selectToken(selectedToken, currentPlan.price, false);
    }
  }, [selectedToken, currentPlan, selectToken]);

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
    await selectToken(token, currentPlan.price, false);
  };

  const handleBackToSubscriptions = () => {
    navigate(`/dappSubscriptions?id=${dappId}`);
  };

  const handleSubscribe = async () => {
    if (!dappId || !subId || !selectedToken || !transferAmount || !currentPlan) return;
    
    setIsProcessing(true);
    try {
      const params: SubscriptionPaymentParams & { usdAmount: number } = {
        dapp_id: dappId,
        plan_id: subId,
        payment_token: selectedToken.tokenId,
        usdAmount: currentPlan.price
      };
      
      const result = await subscribeToPlan(params);
      if (result.success) {
        alert('Subscription successful!');
        handleClick('/mySubscriptions')();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert('Subscription failed: ' + message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getReferralUrl = (): string => {
    if (!subId || !dappId || !currentPlan) return '';
    
    return generateReferralUrl('/subscriptionInfoReferral', {
      subId,
      dappId,
      planName: currentPlan.plan_name,
      price: currentPlan.price,
      tier: currentPlan.tier,
      referrerId: 'current-user-address'
    });
  };

  if (loadError) {
    return (
      <div className="subscription-info-page">
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
      <div className="subscription-info-page">
        <div className="container">
          <div className="card">
            <div className="loading">Loading plan details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-info-page">
      <div className="container">
        <div className="card">
          <button onClick={handleBackToSubscriptions} className="back-button">
            ← Back to Subscriptions
          </button>
        </div>

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
                
                {/* Fee Breakdown */}
                {feeBreakdown && (
                  <div className="fee-breakdown">
                    <h5>Fee Distribution:</h5>
                    <div className="fee-item">
                      <span>Developer:</span>
                      <span>{feeBreakdown.rewards_amount.toFixed(6)} {transferAmount.symbol}</span>
                    </div>
                    <div className="fee-item">
                      <span>Stakers:</span>
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
                  </div>
                )}
              </div>
            )}

            <button 
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={isProcessing || !selectedToken || !transferAmount || isCalculating}
            >
              {isProcessing ? 'Processing...' : 
               isCalculating ? 'Calculating...' : 
               `Subscribe Now - ${transferAmount ? transferAmount.amount.toFixed(6) + ' ' + transferAmount.symbol : 'Select Token'}`}
            </button>
          </div>
        </div>

        {/* Referral Section */}
        <div className="card">
          <h3>Share & Earn</h3>
          <p>Share this subscription with friends and earn rewards!</p>
          <div className="referral-input">
            <input 
              type="text" 
              value={getReferralUrl()} 
              readOnly 
            />
            <button onClick={() => navigator.clipboard.writeText(getReferralUrl())}>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionInfoPage;