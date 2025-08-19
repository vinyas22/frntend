export interface QuarterPeriod {
  label: string;
  value: string;
  year: number;
  quarter: number;
  entryCount: number;
  totalAmount: number;
}

export interface YearPeriod {
  year: number;
  label: string;
  value: string;
  entryCount: number;
  totalAmount: number;
}

export interface WeekPeriod {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

export interface MonthPeriod {
  year: number;
  month: number;
  label: string;
  value: string;
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

export interface DailyTotal {
  date: string;
  total: number;
}

export interface DetailedDaily {
  date: string;
  category: string;
  amount: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface DetailedMonthly {
  month: string;
  category: string;
  amount: number;
}

export interface QuarterlyTotal {
  quarter: string;
  total: number;
}

export interface ReportData {
  type: string;
  totalExpense?: number;
  totalIncome?: number;
  savings?: number;
  savingsRate?: number;
  category?: CategoryTotal[];
  daily?: DailyTotal[];
  detailed_daily?: DetailedDaily[];
  monthly?: MonthlyTotal[];
  detailed_monthly?: DetailedMonthly[];
  quarterly?: QuarterlyTotal[];
  
  // ✅ ADDED MISSING PREVIOUS MONTH PROPERTY
  previousMonth?: {
    totalExpense?: number;
    totalIncome?: number;
    category?: CategoryTotal[];
    daily?: DailyTotal[];
    detailed_daily?: DetailedDaily[];
  };
  
  // ✅ PREVIOUS WEEK DATA (FIXED)
  previousWeek?: {
    totalExpense?: number;
    totalIncome?: number;
    category?: CategoryTotal[];
    daily?: DailyTotal[];
    detailed_daily?: DetailedDaily[];
  };
  
  // ✅ PREVIOUS QUARTER DATA (FIXED)
  previousQuarter?: {
    totalExpense?: number;
    totalIncome?: number;
    category?: CategoryTotal[];
    daily?: DailyTotal[];
    detailed_daily?: DetailedDaily[];
  };
  
  // ✅ PREVIOUS YEAR DATA (FIXED)
  previousYear?: {
    year?: number;
    totalExpense?: number;
    totalIncome?: number;
    savings?: number;
    savingsRate?: number;
    category?: CategoryTotal[];
    monthly?: MonthlyTotal[];
    detailed_monthly?: DetailedMonthly[];
  };
  
  // Period information
  quarter?: {
    year: number;
    quarter: number;
    label: string;
    months: string[];
  };
  
  month?: {
    year: number;
    month: number;
    label: string;
  };
  
  year?: {
    year: number;
    label: string;
    months?: string[];
    quarters?: string[];
  };
  
  // Additional flags
  hasPreviousYearData?: boolean;
}
