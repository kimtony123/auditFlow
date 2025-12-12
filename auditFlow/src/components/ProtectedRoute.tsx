// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserType } from '../context/UserTypeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier: 'basic' | 'premium' | 'pro' | 'enterprise';
  requiredFeature?: string;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredTier,
  requiredFeature,
  redirectTo = '/'
}) => {
  const { userTier, hasFeatureAccess } = useUserType();
  
  const userTierLevels = {
    'guest': 0,
    'basic': 1,
    'premium': 2,
    'pro': 3,
    'enterprise': 4
  };
  
  const hasTierAccess = userTierLevels[userTier] >= userTierLevels[requiredTier];
  const hasFeature = requiredFeature ? hasFeatureAccess(requiredFeature) : true;
  
  if (!hasTierAccess || !hasFeature) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;