import type { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react";
import { useSubscription } from "../hooks/useSubscription";



const SubscriptionPlansPage = ({ dappId }: { dappId: string }) => {
  const { 
    subscriptionData,
    plans,
    userSubscription,
    currentPlan,
    subscribeToPlan,
    isLoading 
  } = useSubscription(dappId);

  const handleSubscribe = async (planId: Key | null | undefined) => {
    const id = planId ? String(planId) : '';
    if (!id) {
      alert('Invalid plan selected.');
      return;
    }

    try {
      await subscribeToPlan(dappId, id);
      alert('Subscription successful!');
    } catch (error) {
      alert('Subscription failed. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading subscription plans...</div>;
  }

  return (
    <div className="subscription-page">
      <h2>Subscription Plans</h2>
      
      {/* Current Subscription Status */}
      <div className="current-status">
        {userSubscription ? (
          <div className="current-subscription">
            <h3>Current Plan: {currentPlan?.plan_name || userSubscription.tier}</h3>
            <p>Status: {userSubscription.status}</p>
            <p>Auto-renew: {userSubscription.auto_renew ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <div className="free-user">
            <h3>You are currently on the Free plan</h3>
            <p>Upgrade to remove ads and unlock premium features!</p>
          </div>
        )}
      </div>

      {/* All Available Plans */}
      <div className="plans-grid">
        {plans.map((plan: { plan_id: Key | null | undefined; tier: string; plan_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; price: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; billing_period: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; features: (string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | ReactPortal | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | ReactPortal | Iterable<ReactNode> | null | undefined> | null | undefined)[]; }) => (
          <div key={plan.plan_id} className={`plan-card ${plan.tier}`}>
            <h3>{plan.plan_name}</h3>
            <div className="price">
              ${plan.price}/{plan.billing_period}
            </div>
            <p className="description">{plan.description}</p>
            
            <ul className="features">
              {plan.features.map((feature: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.plan_id)}
              disabled={userSubscription?.plan_id === plan.plan_id}
              className={userSubscription?.plan_id === plan.plan_id ? 'current' : ''}
            >
              {userSubscription?.plan_id === plan.plan_id ? 'Current Plan' : 
               plan.tier === 'free' ? 'Select Free' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};