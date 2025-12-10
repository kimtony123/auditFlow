import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';

export interface FinancialOverview {
  total_income: number;
  total_expenses: number;
  balance: number;
  currency: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  type: 'income' | 'expense';
}

export interface DashboardData {
  overview: FinancialOverview;
  income_breakdown: CategoryBreakdown[];
  expense_breakdown: CategoryBreakdown[];
  history: {
    labels: string[];
    income: number[];
    expenses: number[];
  };
}

export class DashboardService {
  private static processId = process.env.TRACKER_PROCESS_ID;

  /**
   * Fetch dashboard data
   */
  static async fetchDashboardData(timeFilter: string = 'last35days'): Promise<DashboardData> {
    const tags = AOService.createTags("GetDashboardData", {
      timeFilter,
      Data: DataEncoder.encode({ timeFilter })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200 && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch dashboard data");
    }
  }

  /**
   * Get mock dashboard data for demo
   */
  static getMockDashboardData(): DashboardData {
    return {
      overview: {
        total_income: 4250,
        total_expenses: 2850,
        balance: 1400,
        currency: 'USDA'
      },
      income_breakdown: [
        { category: 'Salary', amount: 3000, percentage: 70.6, type: 'income' },
        { category: 'Freelance', amount: 1250, percentage: 29.4, type: 'income' }
      ],
      expense_breakdown: [
        { category: 'Housing', amount: 1200, percentage: 42.1, type: 'expense' },
        { category: 'Food', amount: 450, percentage: 15.8, type: 'expense' },
        { category: 'Transportation', amount: 300, percentage: 10.5, type: 'expense' },
        { category: 'Entertainment', amount: 400, percentage: 14.0, type: 'expense' },
        { category: 'Utilities', amount: 300, percentage: 10.5, type: 'expense' },
        { category: 'Healthcare', amount: 200, percentage: 7.0, type: 'expense' }
      ],
      history: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        income: [3000, 3200, 3100, 3300, 4250, 4000],
        expenses: [2500, 2600, 2700, 2800, 2850, 2900]
      }
    };
  }
}