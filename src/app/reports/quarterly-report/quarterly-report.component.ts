import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption, SeriesOption } from 'echarts';
import * as echarts from 'echarts/core';
import { ReportService } from '../../services/report.service';
import { QuarterPeriod, ReportData, CategoryTotal, DailyTotal, DetailedDaily } from '../../reports/models/report.interface';
import { ThemeService } from '../../services/ThemeService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-quarterly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  providers: [{ provide: NGX_ECHARTS_CONFIG, useValue: { echarts } }],
  templateUrl: './quarterly-report.component.html',
  styleUrls: ['./quarterly-report.component.scss']
})
export class QuarterlyReportComponent implements OnInit {
  selectedQuarter: string = '';
  quarterOptions: QuarterPeriod[] = [];
  isLoading = false;
  isFilterLoading = false;
  isLoadingQuarters = false;
  errorMessage: string | null = null;

  fullReportData: ReportData | null = null;
  displayReportData: ReportData | null = null;
  selectedCategoryFilter: string | null = null;
darkMode = false;

  pieChartOptions: EChartsOption = {};
  monthlyTrendOptions: EChartsOption = {};
  dailyChartOptions: EChartsOption = {};
  quarterComparisonOptions: EChartsOption = {};
  themeSubscription!: Subscription;

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef, private themeService: ThemeService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

    async ngOnInit(): Promise<void> {
    // Subscribe early to theme changes
    this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
      this.darkMode = isDark;
      this.updateCharts();
      this.cdr.markForCheck();
    });

    await this.loadAvailableQuarters();
    if (this.quarterOptions.length > 0 && !this.selectedQuarter) {
      this.selectedQuarter = this.quarterOptions[0].value;
    }
    if (this.selectedQuarter) {
      await this.loadReport();
    }
  }
ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }

  async loadAvailableQuarters(): Promise<void> {
    this.isLoadingQuarters = true;
    this.errorMessage = null;
    try {
      const quarters = await this.reportService.getAvailableQuarters().toPromise();
      this.quarterOptions = quarters ?? [];
      if (this.quarterOptions.length === 0) {
        this.errorMessage = 'No expense data found. Please add some expenses to generate quarterly reports.';
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to load available quarters. Please try again.';
      this.quarterOptions = this.generateFallbackQuarters();
    } finally {
      this.isLoadingQuarters = false;
      this.cdr.markForCheck();
    }
  }

  private generateFallbackQuarters(): QuarterPeriod[] {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
    const quarters: QuarterPeriod[] = [];

    for (let i = 0; i < 4; i++) {
      let year = currentYear;
      let quarter = currentQuarter - i;
      if (quarter <= 0) {
        quarter += 4;
        year--;
      }
      quarters.push({
        label: `Q${quarter} ${year}`,
        value: `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`,
        year,
        quarter,
        entryCount: 0,
        totalAmount: 0
      });
    }
    return quarters;
  }

 async loadReport(): Promise<void> {
  if (!this.selectedQuarter) return;
  try {
    const report = await this.reportService.getQuarterlyReport(this.selectedQuarter).toPromise();
    this.fullReportData = report ?? null;  // Convert undefined to null explicitly
    this.applyFilter();
  } catch {
    this.fullReportData = null;
    this.displayReportData = null;
  }
}


  onQuarterChange(): void {
    if (this.selectedQuarter) {
      this.loadReport();
    }
  }

   onChartClick(event: any): void {
    if (event.seriesType === 'pie' && event.name) {
      this.selectedCategoryFilter = this.selectedCategoryFilter === event.name ? null : event.name;
      this.applyFilter();
    }
  }

  toggleCategoryFilter(category: string): void {
    this.selectedCategoryFilter = this.selectedCategoryFilter === category ? null : category;
    this.applyFilter();
  }

  clearFilter(): void {
    this.selectedCategoryFilter = null;
    this.applyFilter();
  }

  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private getTextColor(): string {
    return this.isDarkMode() ? '#e0e7ff' : '#1e293b';
  }

  private getBackgroundColor(): string {
    return this.isDarkMode() ? '#232e45' : '#fff';
  }

  applyFilter(): void {
    if (!this.fullReportData) return;
    let expense = this.fullReportData.totalExpense ?? 0;
    if (this.selectedCategoryFilter) {
      const cat = (this.fullReportData.category || []).find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount ?? 0;
    }
    this.displayReportData = {
      ...this.fullReportData,
      totalExpense: expense
    };
    this.updateCharts();
    this.cdr.detectChanges();
  }

private updateCharts(): void {
  if (!this.fullReportData || !this.displayReportData) return;

  const darkMode = this.darkMode;

  const piePalette = darkMode
    ? ['#92b4fe', '#ffe066', '#54e346', '#b983ff', '#ffb3c1', '#ffa200', '#2ec4b6', '#fd6f96', '#6a89cc', '#ffbe76']
    : ['#4f46e5', '#fde68a', '#34d399', '#a78bfa', '#fca5a5', '#fbbf24', '#06b6d4', '#f472b6', '#6366f1', '#f59e42'];

  // PIE CHART OPTIONS
  this.pieChartOptions = {
    backgroundColor: darkMode ? '#232e45' : '#fff',
    tooltip: {
      trigger: 'item',
      backgroundColor: darkMode ? '#232a37' : '#fff',
      borderColor: darkMode ? '#39475b' : '#ccc',
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
      formatter: (p: any) => `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
    },
   
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
  label: {
    show: true,              // Always show labels
    position: 'outside',     // Place labels outside the pie slice
    color: this.darkMode ? '#e9eaf0' : '#222', // Use theme-aware color
    fontSize: 16,            // Adjust font size if needed
    fontWeight: 'bold',
    formatter: (params: any) => `${params.name}` // Or full label text
  },      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold', color: darkMode ? '#e9eaf0' : '#222' }
      },
      data: (this.displayReportData.category || []).map(c => ({
        name: c.category || 'Uncategorized',
        value: Math.max(0, c.amount || 0),
        selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
      })),
      itemStyle: { borderColor: darkMode ? '#232e45' : '#fff' }
    }]
  };

  // MONTHLY TREND CHART OPTIONS
  const monthlyData = this.getMonthlyBreakdownData();
  const currentQuarterColor = darkMode ? '#a5b4fc' : '#4f46e5';
  const previousQuarterColor = darkMode ? '#cbd5e1' : '#9ca3af';
  const emphasisBorderColor = darkMode ? '#232e45' : '#fff';

  this.monthlyTrendOptions = {
    backgroundColor: darkMode ? '#232e45' : '#fff',
    tooltip: {
      trigger: 'axis',
      backgroundColor: darkMode ? '#232a37' : '#fff',
      borderColor: darkMode ? '#39475b' : '#ccc',
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
      formatter: (params: any) => {
        const arr = Array.isArray(params) ? params : [params];
        return arr.map((p: any) => `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`).join('<br>');
      }
    },
    legend: {
      data: ['Current Quarter', 'Previous Quarter'],
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' }
    },
    grid: { top: '15%', left: '10%', right: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyData.map(m => m.monthName),
      axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
      axisLabel: { color: darkMode ? '#e9eaf0' : '#222' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
      splitLine: { lineStyle: { color: darkMode ? '#394867' : '#e0e7ff' } },
      axisLabel: {
        color: darkMode ? '#e9eaf0' : '#222',
        formatter: (value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
      }
    },
    series: [
      {
        name: 'Current Quarter',
        type: 'line',
        data: monthlyData.map(m => m.currentAmount),
        itemStyle: { color: currentQuarterColor },
        lineStyle: { color: currentQuarterColor, width: 3 },
        emphasis: {
          focus: 'series',
          itemStyle: { borderColor: emphasisBorderColor, borderWidth: 3 }
        },
        symbol: 'circle',
        symbolSize: 10
      },
      ...(this.fullReportData.previousQuarter ? [{
        name: 'Previous Quarter',
        type: 'line',
        data: monthlyData.map(m => m.previousAmount),
        itemStyle: { color: previousQuarterColor },
        lineStyle: { color: previousQuarterColor, width: 3 },
        emphasis: {
          focus: 'series',
          itemStyle: { borderColor: emphasisBorderColor, borderWidth: 3 }
        },
        symbol: 'circle',
        symbolSize: 10
      }] : [])
    ] as SeriesOption[]
  };

  // DAILY CHART OPTIONS
  const dailyData = this.getDailyBreakdownData();
  const barColor = darkMode ? '#a5b4fc' : '#4f46e5';

  this.dailyChartOptions = {
    backgroundColor: darkMode ? '#232e45' : '#fff',
    tooltip: {
      trigger: 'axis',
      backgroundColor: darkMode ? '#232a37' : '#fff',
      borderColor: darkMode ? '#39475b' : '#ccc',
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`;
      }
    },
    grid: { top: '10%', left: '10%', right: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale)),
      axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
      axisLabel: { color: darkMode ? '#e9eaf0' : '#222' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
      splitLine: { lineStyle: { color: darkMode ? '#394867' : '#e0e7ff' } },
      axisLabel: {
        color: darkMode ? '#e9eaf0' : '#222',
        formatter: (value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
      }
    },
    series: [{
      type: 'bar',
      data: dailyData.map(d => d.currentAmount),
      itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
      emphasis: {
        focus: 'series',
        itemStyle: { borderColor: darkMode ? '#232e45' : '#fff', borderWidth: 3 }
      }
    }]
  };

  // QUARTERLY COMPARISON CHART OPTIONS
  if (this.fullReportData.previousQuarter) {
    const currentCategories = this.fullReportData.category || [];
    const previousCategories = this.fullReportData.previousQuarter.category || [];

    let topCategories: CategoryTotal[];
    if (this.selectedCategoryFilter) {
      topCategories = currentCategories.filter(c => (c.category || 'Uncategorized') === this.selectedCategoryFilter);
    } else {
      topCategories = currentCategories.slice(0, 5);
    }

    const currentColor = darkMode ? '#a5b4fc' : '#4f46e5';
    const previousColor = darkMode ? '#cbd5e1' : '#9ca3af';
    const emphasisBorderColor = darkMode ? '#232e45' : '#fff';

    this.quarterComparisonOptions = {
      backgroundColor: darkMode ? '#232e45' : '#fff',
      tooltip: {
        trigger: 'axis',
        backgroundColor: darkMode ? '#232a37' : '#fff',
        borderColor: darkMode ? '#39475b' : '#ccc',
        textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
        formatter: (params: any) => {
          const arr = Array.isArray(params) ? params : [params];
          return arr.map(p => `${p.seriesName}: ₹${(+p.value || 0).toLocaleString('en-IN')}`).join('<br>');
        }
      },
      legend: { data: ['Current Quarter', 'Previous Quarter'], textStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
      grid: { top: '15%', left: '10%', right: '10%', bottom: '25%', containLabel: true },
      xAxis: {
        type: 'category',
        data: topCategories.map(c => c.category || 'Uncategorized'),
        axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
        axisLabel: { color: darkMode ? '#e9eaf0' : '#222', rotate: 45 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
        splitLine: { lineStyle: { color: darkMode ? '#394867' : '#e0e7ff' } },
        axisLabel: {
          color: darkMode ? '#e9eaf0' : '#222',
          formatter: (value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [
        {
          name: 'Current Quarter',
          type: 'bar',
          data: topCategories.map(c => c.amount),
          itemStyle: { color: currentColor },
          emphasis: {
            itemStyle: {
              borderColor: emphasisBorderColor,
              borderWidth: 2
            }
          }
        },
        {
          name: 'Previous Quarter',
          type: 'bar',
          data: topCategories.map(c => {
            const prev = previousCategories.find(pc => (pc.category || 'Uncategorized') === (c.category || 'Uncategorized'));
            return prev?.amount || 0;
          }),
          itemStyle: { color: previousColor },
          emphasis: {
            itemStyle: {
              borderColor: emphasisBorderColor,
              borderWidth: 2
            }
          }
        }
      ]
    };
  }
}




  // Helper methods for data processing...

  getPreviousQuarterExpense(): number {
    return this.fullReportData?.previousQuarter?.totalExpense ?? 0;
  }

  getIncomeChange(): number {
    const current = this.fullReportData?.totalIncome ?? 0;
    const previous = this.fullReportData?.previousQuarter?.totalIncome ?? 0;
    return current - previous;
  }

  getCurrentQuarterChange(): number {
    const current = this.displayReportData?.totalExpense ?? 0;
    const previous = this.getPreviousQuarterExpense();
    return current - previous;
  }

  getQuarterSavings(): number {
    const income = this.fullReportData?.totalIncome ?? 0;
    const expense = this.displayReportData?.totalExpense ?? 0;
    return income - expense;
  }

  getQuarterSavingsRate(): number {
    const income = this.fullReportData?.totalIncome ?? 0;
    const savings = this.getQuarterSavings();
    return income > 0 ? Math.round((savings / income) * 100) : 0;
  }

  getSavingsChange(): number {
    const currentSavings = this.getQuarterSavings();
    const previousIncome = this.fullReportData?.previousQuarter?.totalIncome ?? 0;
    const previousExpense = this.getPreviousQuarterExpense();
    const previousSavings = previousIncome - previousExpense;
    return currentSavings - previousSavings;
  }

  getPreviousAmount(category: string): number {
    if (!this.fullReportData?.previousQuarter?.category) return 0;
    const found = this.fullReportData.previousQuarter.category.find(c => 
      (c.category || 'Uncategorized') === category
    );
    return found?.amount ?? 0;
  }

  getChangeAmount(category: string): number {
    const current = this.fullReportData?.category?.find(c => 
      (c.category || 'Uncategorized') === category
    )?.amount ?? 0;
    const previous = this.getPreviousAmount(category);
    return current - previous;
  }

  getCategoryTotalForQuarter(): number {
    if (!this.selectedCategoryFilter || !this.fullReportData?.category) return 0;
    const found = this.fullReportData.category.find(c => 
      (c.category || 'Uncategorized') === this.selectedCategoryFilter
    );
    return found?.amount ?? 0;
  }

getMonthlyBreakdownData(): any[] {
  const quarterInfo = this.fullReportData?.quarter;
  if (!quarterInfo) return [];

  const quarterNum = Number(quarterInfo.quarter) || 1;
  const quarterMonths = quarterInfo.months ?? ['Jan', 'Feb', 'Mar'];
  const year = quarterInfo.year ?? new Date().getFullYear();
  const prevQuarterDaily = this.fullReportData?.previousQuarter?.detailed_daily ?? [];
  const currentDetailedDaily = this.fullReportData?.detailed_daily ?? [];

  const startMonth = (quarterNum - 1) * 3 + 1;

  return quarterMonths.map((monthName, index) => {
    const monthNumber = startMonth + index;
    const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;

    let prevYear = year;
    let prevMonthNumber = monthNumber - 3;
    if (prevMonthNumber < 1) {
      prevMonthNumber += 12;
      prevYear -= 1;
    }
    const prevMonthKey = `${prevYear}-${String(prevMonthNumber).padStart(2, '0')}`;

    // If a category filter is selected, filter by category; otherwise use overall totals
    let currentAmount: number;
    let previousAmount: number;

    if (this.selectedCategoryFilter) {
      // Current Quarter for category
      currentAmount = currentDetailedDaily
        .filter(d => d.date.startsWith(monthKey) && (d.category || 'Uncategorized') === this.selectedCategoryFilter)
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      // Previous Quarter for category
      previousAmount = prevQuarterDaily
        .filter(d => d.date.startsWith(prevMonthKey) && (d.category || 'Uncategorized') === this.selectedCategoryFilter)
        .reduce((sum, d) => sum + (d.amount || 0), 0);
    } else {
      // All Expenses
      currentAmount = this.getMonthTotalFromDaily(monthNumber);
      previousAmount = this.fullReportData?.previousQuarter?.daily
        ? this.fullReportData.previousQuarter.daily
            .filter(d => d.date?.startsWith(prevMonthKey))
            .reduce((sum, d) => sum + (d.total ?? 0), 0)
        : 0;
    }

    return {
      monthName,
      monthNumber,
      currentAmount,
      previousAmount,
      difference: currentAmount - previousAmount
    };
  });
}





  getDailyBreakdownData(): any[] {
    if (!this.fullReportData?.daily) return [];
    return this.fullReportData.daily
      .map((day: DailyTotal) => ({
        date: day.date,
        currentAmount: this.selectedCategoryFilter ?
          this.getCategoryAmountForDate(day.date, this.selectedCategoryFilter) :
          day.total,
        previousAmount: this.getPreviousQuarterDayAmount(day.date),
        difference: (this.selectedCategoryFilter ?
          this.getCategoryAmountForDate(day.date, this.selectedCategoryFilter) :
          day.total) - this.getPreviousQuarterDayAmount(day.date)
      }))
      .filter(day => day.currentAmount > 0 || day.previousAmount > 0);
  }

  getCategoryAmountForMonth(monthKey: string, category: string): number {
    if (!this.fullReportData?.detailed_daily) return 0;
    return this.fullReportData.detailed_daily
      .filter(d => d.date.startsWith(monthKey) && (d.category || 'Uncategorized') === category)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  getCategoryAmountForDate(date: string, category: string): number {
    if (!this.fullReportData?.detailed_daily) return 0;
    return this.fullReportData.detailed_daily
      .filter(d => d.date === date && (d.category || 'Uncategorized') === category)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  getMonthTotalFromDaily(monthNumber: number): number {
    if (!this.fullReportData?.daily) return 0;
    const year = this.fullReportData.quarter?.year || new Date().getFullYear();
    const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;
    return this.fullReportData.daily
      .filter(d => d.date.startsWith(monthKey))
      .reduce((sum, d) => sum + (d.total || 0), 0);
  }
getPreviousQuarterDayAmount(date: string): number {
  if (!this.fullReportData?.previousQuarter?.daily) return 0;
  const currentDate = new Date(date);
  const prevDate = new Date(currentDate);
  prevDate.setMonth(currentDate.getMonth() - 3); // shift date back 3 months for previous quarter equivalent
  const prevDateStr = prevDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // Compare only date parts (first 10 chars) to match backend ISO date strings with time
  const found = this.fullReportData.previousQuarter.daily.find(d =>
    d.date.substring(0, 10) === prevDateStr
  );
  return found?.total ?? 0;
}


  getPreviousCategoryAmountForMonth(monthNumber: number, category: string): number {
    if (!this.fullReportData?.previousQuarter?.detailed_daily) return 0;
    const prevYear = this.fullReportData.quarter?.year || new Date().getFullYear();
    const monthKey = `${prevYear}-${String(monthNumber).padStart(2, '0')}`;
    return this.fullReportData.previousQuarter.detailed_daily
      .filter(d => d.date.startsWith(monthKey) && (d.category || 'Uncategorized') === category)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  formatAsINR(value: number): string {
    return (value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  }

  getQuarterRange(): string {
    if (!this.fullReportData?.quarter) return '';
    const q = this.fullReportData.quarter;
    return q?.months && q.months.length === 3 ? `${q.months[0]} - ${q.months[1]} ${q.year}` : '';
  }

  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0) return '0.0';
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }

  public getDetailedMonthlyData(): any[] {
  if (!this.selectedCategoryFilter) return [];
  if (!this.fullReportData) return [];
  
  if (!this.fullReportData.detailed_monthly) {
    return [];
  }

  return this.fullReportData.detailed_monthly
    .filter(month => {
      // Filter to remove zero amounts or no data
      return (month.currentAmount && month.currentAmount > 0) || 
             (month.previousAmount && month.previousAmount > 0);
    });
}
}
