import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';

export interface AIAnalysisRequest {
  days: number;
  processId: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  concerns: string[];
  positiveSigns: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  topSpendingCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface AIAnalysisResponse {
  riskAssessment: RiskAssessment;
  summary: FinancialSummary;
  insights: string[];
  recommendations: string[];
  trends: string[];
  success: boolean;
  message?: string;
}

export class AIAnalysisService {
  private static processId = process.env.AI_PROCESS_ID;

  /**
   * Request AI analysis of transactions
   */
  static async analyzeTransactions(days: number): Promise<AIAnalysisResponse> {
    const tags = AOService.createTags("AnalyzeTransactions", {
      days: days.toString(),
      Data: DataEncoder.encode({ days, action: "analyze" })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200 && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to analyze transactions");
    }
  }

  /**
   * Get analysis status by task reference
   */
  static async getAnalysisStatus(taskRef: string): Promise<AIAnalysisResponse> {
    const tags = AOService.createTags("GetAnalysisStatus", {
      taskRef,
      Data: DataEncoder.encode({ taskRef })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to get analysis status");
    }
  }

  /**
   * Generate sample analysis for demo (fallback)
   */
  static generateSampleAnalysis(days: number): AIAnalysisResponse {
    // Adjust numbers based on days analyzed
    const multiplier = days / 30; // Base on 30-day month
    
    const baseAnalysis: AIAnalysisResponse = {
      riskAssessment: {
        level: "medium",
        concerns: ["High spending on dining out", "Low savings rate"],
        positiveSigns: ["Consistent income", "No debt"]
      },
      summary: {
        totalIncome: Math.round(4250 * multiplier),
        totalExpenses: Math.round(2850 * multiplier),
        netCashFlow: Math.round(1400 * multiplier),
        savingsRate: 0.33,
        topSpendingCategories: [
          { category: "Housing", amount: Math.round(1200 * multiplier), percentage: 42 },
          { category: "Food", amount: Math.round(450 * multiplier), percentage: 16 },
          { category: "Transportation", amount: Math.round(300 * multiplier), percentage: 11 }
        ]
      },
      insights: [
        "Your savings rate of 33% is excellent - well above the recommended 20%",
        "Housing costs represent 42% of your expenses, which is higher than the recommended 30%",
        "You have a consistent positive cash flow of $1,400 per month"
      ],
      recommendations: [
        "Consider finding ways to reduce housing costs to below 30% of your income",
        "Continue your good savings habits - consider investing the surplus",
        "Set up automatic transfers to savings to maintain your high savings rate"
      ],
      trends: [
        "Income has been stable over the last 3 months",
        "Dining expenses increased by 15% this month",
        "Transportation costs decreased due to working from home"
      ],
      success: true
    };

    // Add period-specific insights
    if (days > 60) {
      baseAnalysis.insights.push(`Your financial patterns are consistent over this ${days}-day period`);
      baseAnalysis.trends.push(`Analysis based on ${days} days of data shows long-term stability`);
    }

    return baseAnalysis;
  }
}