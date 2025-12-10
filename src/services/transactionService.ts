import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category_id: string;
  category_name: string;
  description: string;
  amount: number;
  date: string;
  created_at: number;
  currency: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description: string;
  icon: string;
}

export interface CreateTransactionData {
  type: 'income' | 'expense';
  category_id: string;
  description: string;
  amount: number;
  date: string;
}

export class TransactionService {
  private static processId = process.env.TRACKER_PROCESS_ID;

  /**
   * Fetch user income categories
   */
  static async fetchUserIncomeCategories(): Promise<TransactionCategory[]> {
    const tags = AOService.createTags("GetUserIncomeCategories", {
      Data: DataEncoder.encode({ action: "get_income_categories" })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200 && response.data.success) {
      return response.data.categories || [];
    } else {
      throw new Error(response.data?.message || "Failed to fetch income categories");
    }
  }

  /**
   * Fetch user expense categories
   */
  static async fetchUserExpenseCategories(): Promise<TransactionCategory[]> {
    const tags = AOService.createTags("GetUserExpenseCategories", {
      Data: DataEncoder.encode({ action: "get_expense_categories" })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200 && response.data.success) {
      return response.data.categories || [];
    } else {
      throw new Error(response.data?.message || "Failed to fetch expense categories");
    }
  }

  /**
   * Fetch all categories (both income and expense)
   */
  static async fetchAllUserCategories(): Promise<{
    income: TransactionCategory[];
    expense: TransactionCategory[];
  }> {
    try {
      const [incomeCategories, expenseCategories] = await Promise.all([
        this.fetchUserIncomeCategories(),
        this.fetchUserExpenseCategories()
      ]);

      return {
        income: incomeCategories,
        expense: expenseCategories
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch user categories');
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(transactionData: CreateTransactionData): Promise<boolean> {
    const tags = AOService.createTags("CreateTransaction", {
      type: transactionData.type,
      category_id: transactionData.category_id,
      description: transactionData.description,
      amount: transactionData.amount.toString(),
      date: transactionData.date,
      Data: DataEncoder.encode(transactionData)
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200) {
      return response.data.success || false;
    } else {
      throw new Error(response.data?.message || "Failed to create transaction");
    }
  }

  /**
   * Get category by ID from both income and expense categories
   */
  static async getCategoryById(categoryId: string): Promise<TransactionCategory | null> {
    try {
      const { income, expense } = await this.fetchAllUserCategories();
      const allCategories = [...income, ...expense];
      return allCategories.find(cat => cat.id === categoryId) || null;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return null;
    }
  }
}