import { useState, useCallback } from 'react';
import { useConnection } from '@arweave-wallet-kit/react';
import { TransactionService, type TransactionCategory, type CreateTransactionData } from '../services/transactionService';

export const useTransactions = () => {
  const { connected } = useConnection();
  const [incomeCategories, setIncomeCategories] = useState<TransactionCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<TransactionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all categories (income and expense)
   */
  const fetchAllCategories = useCallback(async () => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const categories = await TransactionService.fetchAllUserCategories();
      setIncomeCategories(categories.income);
      setExpenseCategories(categories.expense);
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  /**
   * Fetch only income categories
   */
  const fetchIncomeCategories = useCallback(async () => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const categories = await TransactionService.fetchUserIncomeCategories();
      setIncomeCategories(categories);
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch income categories';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  /**
   * Fetch only expense categories
   */
  const fetchExpenseCategories = useCallback(async () => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const categories = await TransactionService.fetchUserExpenseCategories();
      setExpenseCategories(categories);
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expense categories';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  /**
   * Create a new transaction
   */
  const createTransaction = useCallback(async (transactionData: CreateTransactionData) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await TransactionService.createTransaction(transactionData);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  /**
   * Get categories by type
   */
  const getCategoriesByType = useCallback((type: 'income' | 'expense') => {
    return type === 'income' ? incomeCategories : expenseCategories;
  }, [incomeCategories, expenseCategories]);

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback(async (categoryId: string) => {
    return await TransactionService.getCategoryById(categoryId);
  }, []);

  return {
    // Data
    incomeCategories,
    expenseCategories,
    allCategories: [...incomeCategories, ...expenseCategories],
    
    // Actions
    fetchAllCategories,
    fetchIncomeCategories,
    fetchExpenseCategories,
    createTransaction,
    getCategoriesByType,
    getCategoryById,
    
    // State
    isLoading,
    error,
    clearError: () => setError(null)
  };
};