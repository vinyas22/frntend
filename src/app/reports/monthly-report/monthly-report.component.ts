import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { SharedModule } from '../../shared/shared.module';
import { ReportService } from '../../services/report.service';
import { ReportData } from '../../reports/models/report.interface';
import { ThemeService } from '../../services/ThemeService';

@Component({
  selector: 'app-monthly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, SharedModule],
  providers: [{ provide: NGX_ECHARTS_CONFIG, useValue: { echarts } }],
  templateUrl: './monthly-report.component.html',
  styleUrls: ['./monthly-report.component.scss']
})
export class MonthlyReportComponent implements OnInit {
  selectedMonth: string = formatDate(new Date(), 'yyyy-MM', 'en-IN');
  isLoading = false;
  isFilterLoading = false;
  errorMessage: string | null = null;
 pieChart: echarts.ECharts | null = null;
  barChart: echarts.ECharts | null = null;
  comparisonChart: echarts.ECharts | null = null;
  fullReportData: ReportData | null = null;
  displayReportData: ReportData | null = null;
  selectedCategoryFilter: string | null = null;
@ViewChild('pieChartContainer') pieChartEl!: ElementRef;
@ViewChild('barChartContainer') barChartEl!: ElementRef;
@ViewChild('comparisonChartContainer') comparisonChartEl!: ElementRef;
  pieChartOptions: EChartsOption = {};
  barChartOptions: EChartsOption = {};
  comparisonChartOptions: EChartsOption = {};
themeSubscription!: Subscription;
darkMode = false;
  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,private themeService: ThemeService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

ngOnInit(): void {
  this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
    this.darkMode = isDark;
    this.updateCharts();  // Recalculate and reassign chart option objects here
  });

  this.loadReport();  // initial data load
}
ngAfterViewInit() {
  this.pieChart = echarts.init(this.pieChartEl.nativeElement);
  this.barChart = echarts.init(this.barChartEl.nativeElement);
  this.comparisonChart = echarts.init(this.comparisonChartEl.nativeElement);

  this.updateCharts(); // Initial chart rendering
}
ngOnDestroy() {
  this.pieChart?.dispose();
  this.barChart?.dispose();
  this.comparisonChart?.dispose();
}


  async loadReport(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedCategoryFilter = null;

    const dateForApi = `${this.selectedMonth}-01`;
    try {
      const report = await firstValueFrom(this.reportService.getMonthlyReport(dateForApi));
      this.fullReportData = report;
      this.applyFilter();
    } catch (error: any) {
      console.error('Monthly Report Error:', error);
      this.errorMessage = error.error?.message || 'Failed to load report.';
      this.fullReportData = null;
      this.displayReportData = null;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onMonthChange(): void {
    this.loadReport();
  }

  onChartClick(event: any) {
  if (event.seriesType === 'pie' && event.name) {
    this.selectedCategoryFilter = this.selectedCategoryFilter === event.name ? null : event.name;
    this.applyFilter();  // Apply filter to update charts and data
  }
}


  toggleCategoryFilter(category: string): void {
    this.selectedCategoryFilter =
      this.selectedCategoryFilter === category ? null : category;
    this.applyFilter();
  }

  clearFilter(): void {
    this.selectedCategoryFilter = null;
    this.applyFilter();
  }

  get isDailySpendFilteredAndEmpty(): boolean {
    return !!this.selectedCategoryFilter && !this.displayReportData?.daily?.length;
  }

  /**
   * Get daily breakdown data with 3-tier fallback:
   *  1. Use detailed_daily if available
   *  2. Otherwise, use daily totals proportionally
   *  3. Otherwise, even spread category total over dates
   */
 getDailyBreakdownData(): any[] {
  // If no filter selected or no data loaded, return empty
  if (!this.selectedCategoryFilter || !this.fullReportData) return [];

  const data = this.fullReportData;
  const allDates = new Set<string>();

  // Collect all unique dates for current month in the selected category
  data.detailed_daily
    ?.filter(d => (d.category || 'Uncategorized') === this.selectedCategoryFilter)
    .forEach(d => allDates.add(d.date));

  // Collect dates for previous month if available
  if (data.previousMonth?.detailed_daily) {
    data.previousMonth.detailed_daily
      .filter(d => (d.category || 'Uncategorized') === this.selectedCategoryFilter)
      .forEach(d => allDates.add(d.date));
  } else if (data.previousMonth?.daily) {
    data.previousMonth.daily.forEach(d => allDates.add(d.date));
  } // Else fallback if no previous month daily breakdown

  // Calculate totals required for even spread fallback
  const prevCatTotal = Number(
    data.previousMonth?.category
      ?.find(c => (c.category || 'Uncategorized') === this.selectedCategoryFilter)?.amount || 0
  );
  const prevMonthTotal =
    data.previousMonth?.daily?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;

  // Sort all collected dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate even spread fallback value if needed
  const evenSpread =
    prevCatTotal > 0 && sortedDates.length > 0
      ? Math.round(prevCatTotal / sortedDates.length)
      : 0;

  // Build the final array with daily current, previous amounts and difference
  return sortedDates.map(date => {
    const currentAmount = Math.round(
      data.detailed_daily
        ?.filter(d => d.date === date && (d.category || 'Uncategorized') === this.selectedCategoryFilter)
        ?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0
    );

    let previousAmount = 0;
    if (data.previousMonth?.detailed_daily) {
      previousAmount = Math.round(
        data.previousMonth.detailed_daily
          .filter(d => d.date === date && (d.category || 'Uncategorized') === this.selectedCategoryFilter)
          .reduce((sum, d) => sum + Number(d.amount || 0), 0)
      );
    } else if (data.previousMonth?.daily && prevMonthTotal > 0 && prevCatTotal > 0) {
      const dailyTotal = data.previousMonth.daily.find(d => d.date === date)?.total || 0;
      if (dailyTotal > 0) {
        previousAmount = Math.round((prevCatTotal / prevMonthTotal) * dailyTotal);
      }
    } else if (evenSpread > 0) {
      // Even spread fallback
      previousAmount = evenSpread;
    }

    return {
      date,
      dayName: new Date(date).toLocaleDateString('en-IN', { weekday: 'long' }),
      currentAmount,
      previousAmount,
      difference: currentAmount - previousAmount
    };
  });
}


  getDailyBreakdownTotals(): any {
    const rows = this.getDailyBreakdownData();
    const currentTotal = rows.reduce((sum, r) => sum + (r.currentAmount || 0), 0);
    const previousTotal = rows.reduce((sum, r) => sum + (r.previousAmount || 0), 0);
    return {
      currentTotal: Math.round(currentTotal),
      previousTotal: Math.round(previousTotal),
      totalDifference: Math.round(currentTotal - previousTotal)
    };
  }

  getPreviousAmount(category: string): number {
    return Number(
      this.fullReportData?.previousMonth?.category?.find(
        c => (c.category || 'Uncategorized') === category
      )?.amount || 0
    );
  }

  getChangeAmount(category: string): number {
    const current = this.fullReportData?.category?.find(
      c => (c.category || 'Uncategorized') === category
    )?.amount || 0;
    return Number(current) - this.getPreviousAmount(category);
  }

applyFilter(): void {
  if (!this.fullReportData) return;

  this.isFilterLoading = true;

  let expense = this.fullReportData.totalExpense;
  const dailyMap = new Map<string, number>();

  if (this.selectedCategoryFilter) {
    // Find the selected category's total amount
    const cat = this.fullReportData.category?.find(
      c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
    );
    expense = cat?.amount || 0;

    // Aggregate detailed_daily data for the selected category
    this.fullReportData.detailed_daily?.forEach(d => {
      if ((d.category || 'Uncategorized') === this.selectedCategoryFilter) {
        dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.amount);
      }
    });
  } else {
    // No filter: aggregate all category detailed_daily data
    this.fullReportData.detailed_daily?.forEach(d => {
      dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.amount);
    });
  }

  // Convert dailyMap to sorted daily array (date, total)
  const dailyData = Array.from(dailyMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update displayReportData with filtered totals and daily data for charts
  this.displayReportData = {
    ...this.fullReportData,
    totalExpense: expense,
    daily: dailyData,
  };

  // Update all charts with new filtered data and theme
  this.updateCharts();

  this.isFilterLoading = false;
  this.cdr.markForCheck();  // trigger Angular change detection if needed
}




private updateCharts(): void {
  if (!this.fullReportData || !this.displayReportData) return;

  const darkMode = this.darkMode;

  // Color palettes for dark and light modes
  const piePalette = darkMode
    ? ['#92b4fe', '#ffe066', '#54e346', '#b983ff', '#ffb3c1', '#ffa200', '#2ec4b6', '#fd6f96', '#6a89cc', '#ffbe76']
    : ['#4f46e5', '#fde68a', '#34d399', '#a78bfa', '#fca5a5', '#fbbf24', '#06b6d4', '#f472b6', '#6366f1', '#f59e42'];

  // Pie chart option using filtered category data
  this.pieChartOptions = {
    backgroundColor: darkMode ? '#232a37' : '#fff',
    color: piePalette,
    tooltip: {
      trigger: 'item',
      backgroundColor: darkMode ? '#232a37' : '#fff',
      borderColor: darkMode ? '#39475b' : '#ccc',
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
      formatter: (p: any) =>
        `${p.name}: ₹${Math.round(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
    },
    
    series: [{
      type: 'pie',
      radius: ['30%', '70%'],
      center: ['50%', '50%'],
      label: {
        show: true,
        position: 'outside',
        color: darkMode ? '#e9eaf0' : '#222',
        formatter: (params: any) =>
          `${params.name}: ₹${Math.round(+params.value || 0).toLocaleString('en-IN')}`
      },
      data: (this.displayReportData.category || []).map(c => ({
        name: c.category || 'Uncategorized',
        value: Math.round(Number(c.amount) || 0),
        selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
      })),
      itemStyle: { borderColor: darkMode ? '#232a37' : '#fff' }
    }]
  };

  // Bar chart option using filtered daily data
  const dailyData = this.displayReportData.daily || [];
  this.barChartOptions = {
    backgroundColor: darkMode ? '#232a37' : '#fff',
    tooltip: {
      trigger: 'axis',
      backgroundColor: darkMode ? '#232a37' : '#fff',
      borderColor: darkMode ? '#39475b' : '#ccc',
      textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
      formatter: (params: any) =>
        `${params[0]?.axisValue}: ₹${Math.round(+params[0]?.value || 0).toLocaleString('en-IN')}`
    },
    xAxis: {
      type: 'category',
      data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale)),
      axisLabel: { rotate: 45, fontSize: 10, color: darkMode ? '#e9eaf0' : '#222' },
      axisLine: { lineStyle: { color: darkMode ? '#39475b' : '#222' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => v >= 1000 ? `₹${Math.round(v / 1000)}K` : `₹${v}`,
        color: darkMode ? '#e9eaf0' : '#222'
      },
      axisLine: { lineStyle: { color: darkMode ? '#39475b' : '#222' } },
      splitLine: { lineStyle: { color: darkMode ? '#394867' : '#e0e7ff' } }
    },
    series: [{
      type: 'bar',
      data: dailyData.map(d => Math.round(d.total || 0)),
      itemStyle: { color: darkMode ? '#a5b4fc' : '#4f46e5', borderRadius: [4, 4, 0, 0] },
      emphasis: {
        focus: 'series',
        itemStyle: { borderColor: darkMode ? '#232e45' : '#fff', borderWidth: 3 }
      }
    }]
  };

  // Comparison chart option with filtered category data if any
  if (this.fullReportData.previousMonth) {
    let lastMonthValue = Math.round(Number(this.fullReportData.previousMonth.totalExpense) || 0);
    let thisMonthValue = Math.round(Number(this.fullReportData.totalExpense) || 0);

    if (this.selectedCategoryFilter) {
      const prev = this.fullReportData.previousMonth.category?.find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      lastMonthValue = Math.round(Number(prev?.amount) || 0);

      const curr = this.fullReportData.category?.find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      thisMonthValue = Math.round(Number(curr?.amount) || 0);
    }

    this.comparisonChartOptions = {
      backgroundColor: darkMode ? '#232a37' : '#fff',
      tooltip: {
        trigger: 'axis',
        backgroundColor: darkMode ? '#232a37' : '#fff',
        borderColor: darkMode ? '#39475b' : '#ccc',
        textStyle: { color: darkMode ? '#e9eaf0' : '#222' },
        formatter: (params: any) =>
          params.map((p: any) =>
            `${p.name}: ₹${Math.round(+p.value || 0).toLocaleString('en-IN')}`
          ).join('<br>'),
      },
      xAxis: {
        type: 'category',
        data: ['Previous Month', 'Current Month'],
        axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
        axisLabel: { color: darkMode ? '#e9eaf0' : '#222' }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => v >= 1000 ? `₹${Math.round(v / 1000)}K` : `₹${v}`,
          color: darkMode ? '#e9eaf0' : '#222'
        },
        axisLine: { lineStyle: { color: darkMode ? '#e9eaf0' : '#222' } },
        splitLine: { lineStyle: { color: darkMode ? '#394867' : '#e0e7ff' } }
      },
      series: [{
        type: 'bar',
        data: [
          { value: lastMonthValue, itemStyle: { color: darkMode ? '#cbd5e1' : '#9ca3af' } },
          { value: thisMonthValue, itemStyle: { color: darkMode ? '#a5b4fc' : '#4f46e5' } }
        ],
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => Math.round(+p.value || 0).toLocaleString('en-IN')
        }
      }],
    };
  }
}





  formatAsINR(val: number | string | null | undefined): string {
    const num = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
    return Math.round(num).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  getMonthName(): string {
    if (!this.selectedMonth) return '';
    const [y, m] = this.selectedMonth.split('-');
    return formatDate(new Date(+y, +m - 1, 1), 'MMMM yyyy', this.locale);
  }

  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense) return '0';
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }

  // Add these methods to your existing MonthlyReportComponent class

// ===== HELPER METHODS FOR SAFE ACCESS =====
getMonthSavings(): number {
  const income = this.fullReportData?.totalIncome ?? 0;
  const expense = this.displayReportData?.totalExpense ?? 0;
  return income - expense;
}

getMonthSavingsRate(): number {
  const income = this.fullReportData?.totalIncome ?? 0;
  const savings = this.getMonthSavings();
  return income > 0 ? Math.round((savings / income) * 100) : 0;
}

getIncomeChange(): number {
  const current = this.fullReportData?.totalIncome ?? 0;
  const previous = this.fullReportData?.previousMonth?.totalIncome ?? 0;
  return current - previous;
}

getExpenseChange(): number {
  const current = this.displayReportData?.totalExpense ?? 0;
  const previous = this.fullReportData?.previousMonth?.totalExpense ?? 0;
  return current - previous;
}

getSavingsChange(): number {
  const currentSavings = this.getMonthSavings();
  const previousIncome = this.fullReportData?.previousMonth?.totalIncome ?? 0;
  const previousExpense = this.fullReportData?.previousMonth?.totalExpense ?? 0;
  const previousSavings = previousIncome - previousExpense;
  return currentSavings - previousSavings;
}

getCategoryTotalForMonth(): number {
  if (!this.selectedCategoryFilter || !this.fullReportData?.category) return 0;
  const found = this.fullReportData.category.find(c => 
    (c.category || 'Uncategorized') === this.selectedCategoryFilter
  );
  return found?.amount ?? 0;
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


}