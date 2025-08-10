// ==================
// Main Report Entity
// ==================

export interface ReportData {
  type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  // Common fields for every report
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;

  // Add these ONLY for weekly reports (type === 'weekly')
  weeklySavings?: number;
  weeklySavingsRate?: number;

  // Expense/income breakdown
  category: CategoryData[];

  // Day-wise, month-wise, quarter-wise breakdowns -- presence depends on report type
  daily?: DailyData[];
  monthly?: MonthlyData[];
  quarterly?: QuarterlyData[];
  detailed_daily?: DetailedDailyData[];
  detailed_monthly?: DetailedMonthlyData[];

  // --- Period information objects ---
  /** Quarterly reports */
  quarter?: {
    year: number;
    quarter: number;
    label: string;      // Example: "Q1 2024"
    months: string[];   // Example: ['Jan', 'Feb', 'Mar']
  };

  /** Yearly reports */
  year?: {
    year: number;
    label: string;      // Example: "2024"
    months: string[];   // Example: ['Jan', ...]
    quarters: string[]; // Example: ['Q1', ...]
  };

  hasPreviousYearData?: boolean; // For yearly dashboards

  // Comparative data for previous period(s)
  previousWeek?: PreviousWeekData;
  previousMonth?: PreviousMonthData;
  previousQuarter?: PreviousQuarterData;
  previousYear?: PreviousYearData;

  fromCache?: boolean;
}

// ================
// Yearly Dashboard Strong Typing
// ================

export interface YearlyReportData extends ReportData {
  year: {
    year: number;
    label: string;
    months: string[];
    quarters: string[];
  };
  hasPreviousYearData: boolean;
  monthly: MonthlyData[];
  quarterly: QuarterlyData[];
  daily: DailyData[];
  detailed_monthly?: DetailedMonthlyData[];
  previousYear?: PreviousYearData;
}

export type YearOption = YearPeriod;

// ====================
// Supporting Types
// ====================

export interface CategoryData {
  category: string | null;
  amount: number;
}

export interface DailyData {
  date: string;  // 'YYYY-MM-DD'
  total: number;
}

export interface MonthlyData {
  month: string; // 'YYYY-MM'
  total: number;
}

export interface QuarterlyData {
  quarter: number; // 1, 2, 3, 4
  total: number;
}

export interface DetailedDailyData {
  date: string;
  category: string; // or null
  amount: number;
}

export interface DetailedMonthlyData {
  month: string;
  category: string | null;
  amount: number;
}

// =============
// Previous Periods
// =============

export interface PreviousWeekData {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  category: CategoryData[];
  daily: DailyData[];
}

export interface PreviousMonthData {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  category: CategoryData[];
}

export interface PreviousQuarterData {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  category: CategoryData[];
}

export interface PreviousYearData {
  year: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  category: CategoryData[];
}

// ================
// Period Selector Types for Dropdowns
// ================

export interface AvailablePeriod {
  label: string;       // Display
  value: string;       // For select binding and queries
  entryCount: number;
  totalAmount: number;
}

export interface WeekPeriod extends AvailablePeriod {
  weekStart: string;
  weekEnd: string;
}

export interface MonthPeriod extends AvailablePeriod {
  monthStart: string;
}

export interface QuarterPeriod extends AvailablePeriod {
  year: number;
  quarter: number;
}

export interface YearPeriod extends AvailablePeriod {
  year: number;
}
