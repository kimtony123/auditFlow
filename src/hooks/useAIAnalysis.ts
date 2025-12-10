import { useState, useCallback } from 'react';
import { useConnection } from '@arweave-wallet-kit/react';
import { AIAnalysisService, type AIAnalysisResponse } from '../services/aiAnalysisService';

export const useAIAnalysis = () => {
  const { connected } = useConnection();
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskRef, setCurrentTaskRef] = useState<string | null>(null);

  const analyzeTransactions = useCallback(async (days: number) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      let analysisData: AIAnalysisResponse;
      
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        analysisData = AIAnalysisService.generateSampleAnalysis(days);
      } else {
        analysisData = await AIAnalysisService.analyzeTransactions(days);
      }
      
      setAnalysis(analysisData);
      return analysisData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze transactions';
      setError(errorMessage);
      
      // Fallback to sample analysis on error
      const sampleAnalysis = AIAnalysisService.generateSampleAnalysis(days);
      setAnalysis(sampleAnalysis);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  const checkAnalysisStatus = useCallback(async (taskRef: string) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await AIAnalysisService.getAnalysisStatus(taskRef);
      if (status.success) {
        setAnalysis(status);
      }
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check analysis status';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setCurrentTaskRef(null);
  }, []);

  return {
    // Data
    analysis,
    currentTaskRef,
    
    // Actions
    analyzeTransactions,
    checkAnalysisStatus,
    resetAnalysis,
    
    // State
    isLoading,
    error,
    clearError: () => setError(null)
  };
};