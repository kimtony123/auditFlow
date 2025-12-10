import { useState, useCallback } from 'react';
import { useConnection } from '@arweave-wallet-kit/react';
import { DashboardService, type DashboardData } from '../services/dashboardService';

export const useDashboard = () => {
  const { connected } = useConnection();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('last35days');

  const fetchDashboardData = useCallback(async (filter: string = timeFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      let data: DashboardData;
      
      if (!connected) {
        // Use mock data when not connected
        data = DashboardService.getMockDashboardData();
      } else {
        data = await DashboardService.fetchDashboardData(filter);
      }
      
      setDashboardData(data);
      setTimeFilter(filter);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      // Fallback to mock data
      setDashboardData(DashboardService.getMockDashboardData());
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected, timeFilter]);

  const refreshData = useCallback(() => {
    return fetchDashboardData(timeFilter);
  }, [fetchDashboardData, timeFilter]);

  return {
    // Data
    dashboardData,
    timeFilter,
    
    // Actions
    fetchDashboardData,
    refreshData,
    setTimeFilter,
    
    // State
    isLoading,
    error,
    clearError: () => setError(null)
  };
};