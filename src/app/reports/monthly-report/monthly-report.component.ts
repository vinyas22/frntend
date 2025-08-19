import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { SharedModule } from '../../shared/shared.module';
import { ReportService } from '../../services/report.service';
import { ReportData } from '../../reports/models/report.interface';

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

  fullReportData: ReportData | null = null;
  displayReportData: ReportData | null = null;
  selectedCategoryFilter: string | null = null;

  pieChartOptions: EChartsOption = {};
  barChartOptions: EChartsOption = {};
  comparisonChartOptions: EChartsOption = {};

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.loadReport();
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

  onChartClick(event: any): void {
    if (event.seriesType === 'pie' && event.name) {
      this.selectedCategoryFilter =
        this.selectedCategoryFilter === event.name ? null : event.name;
      this.applyFilter();
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
    if (!this.selectedCategoryFilter || !this.fullReportData) return [];

    const data = this.fullReportData;
    const allDates = new Set<string>();

    // gather current month dates for category
    data.detailed_daily?.filter(d => (d.category || 'Uncategorized') === this.selectedCategoryFilter)
      .forEach(d => allDates.add(d.date));

    // gather previous month dates depending on availability
    if (data.previousMonth?.detailed_daily) {
      data.previousMonth.detailed_daily
        .filter(d => (d.category || 'Uncategorized') === this.selectedCategoryFilter)
        .forEach(d => allDates.add(d.date));
    } else if (data.previousMonth?.daily) {
      data.previousMonth.daily.forEach(d => allDates.add(d.date));
    } else {
      // if no daily breakdown at all, fall back to current month dates only
    }

    // totals needed for proportion/even spread
    const prevCatTotal = Number(
      data.previousMonth?.category
        ?.find(c => (c.category || 'Uncategorized') === this.selectedCategoryFilter)?.amount || 0
    );
    const prevMonthTotal = data.previousMonth?.daily
      ?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;

    const sortedDates = Array.from(allDates).sort();
    const evenSpread = prevCatTotal > 0 && sortedDates.length > 0
      ? Math.round(prevCatTotal / sortedDates.length)
      : 0;

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

    let dailyData = this.fullReportData.daily || [];
    let expense = this.fullReportData.totalExpense;

    if (this.selectedCategoryFilter) {
      const cat = this.fullReportData.category?.find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount || 0;
      const dailyMap = new Map<string, number>();
      this.fullReportData.detailed_daily?.forEach(d => {
        if ((d.category || 'Uncategorized') === this.selectedCategoryFilter) {
          dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.amount);
        }
      });
      dailyData = Array.from(dailyMap.entries())
        .map(([date, amount]) => ({ date, total: amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    this.displayReportData = { ...this.fullReportData, totalExpense: expense, daily: dailyData };
    this.updateCharts();
    this.isFilterLoading = false;
    this.cdr.markForCheck();
  }

  private updateCharts(): void {
    if (!this.fullReportData || !this.displayReportData) return;

    this.pieChartOptions = {
      tooltip: {
        trigger: 'item',
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
          formatter: (params: any) =>
            `${params.name}: ₹${Math.round(+params.value || 0).toLocaleString('en-IN')}`
        },
        data: (this.fullReportData.category || []).map(c => ({
          name: c.category || 'Uncategorized',
          value: Math.round(Number(c.amount) || 0),
          selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
        }))
      }]
    };

    const dailyData = this.displayReportData.daily || [];
    this.barChartOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) =>
          `${params[0].axisValue}: ₹${Math.round(+params[0].value || 0).toLocaleString('en-IN')}`
      },
      xAxis: {
        type: 'category',
        data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale)),
        axisLabel: { rotate: 45, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => v >= 1000 ? `₹${Math.round(v / 1000)}K` : `₹${v}`
        }
      },
      series: [{
        type: 'bar',
        data: dailyData.map(d => Math.round(d.total || 0)),
        itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }
      }]
    };

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
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) =>
            params.map((p: any) =>
              `${p.name}: ₹${Math.round(+p.value || 0).toLocaleString('en-IN')}`
            ).join('<br>')
        },
        xAxis: { type: 'category', data: ['Previous Month', 'Current Month'] },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (v: number) => v >= 1000 ? `₹${Math.round(v / 1000)}K` : `₹${v}`
          }
        },
        series: [{
          type: 'bar',
          data: [
            { value: lastMonthValue, itemStyle: { color: '#9ca3af' } },
            { value: thisMonthValue, itemStyle: { color: '#4f46e5' } }
          ],
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            formatter: (p: any) => Math.round(+p.value || 0).toLocaleString('en-IN')
          }
        }]
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

}
