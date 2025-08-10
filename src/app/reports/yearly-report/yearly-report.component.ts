import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { ReportService } from '../../services/report.service';
import { firstValueFrom } from 'rxjs';
import {
  YearOption,
  YearlyReportData,
  CategoryData,
  MonthlyData
} from '../../reports/models/report.interface';

@Component({
  selector: 'app-yearly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './yearly-report.component.html',
  styleUrls: ['./yearly-report.component.scss']
})
export class YearlyReportComponent implements OnInit {
  selectedYear: string = '';
  yearOptions: YearOption[] = [];
  isLoading = false;
  isLoadingYears = false;
  errorMessage: string | null = null;

  fullReportData: YearlyReportData | null = null;
  displayReportData: YearlyReportData | null = null;
  selectedCategoryFilter: string | null = null;

  pieChartOptions: EChartsOption = {};
  monthlyTrendOptions: EChartsOption = {};
  quarterlyBarOptions: EChartsOption = {};
  comparisonChartOptions: EChartsOption = {};

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAvailableYears();
    if (this.yearOptions.length > 0) {
      this.selectedYear = this.yearOptions[0].value;
      await this.loadReport();
    }
  }

  async loadAvailableYears(): Promise<void> {
    this.isLoadingYears = true;
    this.errorMessage = null;
    try {
      const options = await firstValueFrom(this.reportService.getAvailableYears());
      this.yearOptions = options ?? [];
      if (this.yearOptions.length === 0) {
        this.errorMessage = 'No expense data found. Please add some expenses to generate yearly reports.';
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to load available years. Please try again.';
      this.yearOptions = [];
    } finally {
      this.isLoadingYears = false;
      this.cdr.markForCheck();
    }
  }

  private yearToDate(year: string | number): string {
    return `${year}-01-01`;
  }

  async loadReport(): Promise<void> {
    if (!this.selectedYear) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedCategoryFilter = null;
    try {
      const report = await firstValueFrom(
        this.reportService.getYearlyReport(this.yearToDate(this.selectedYear))
      );
      this.fullReportData = (report as YearlyReportData) ?? null;
      this.applyFilter();
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Failed to load yearly report.';
      this.fullReportData = null;
      this.displayReportData = null;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onYearChange(): void {
    if (this.selectedYear) this.loadReport();
  }

  onChartClick(event: any): void {
    if (event.seriesType === 'pie' && event.name) {
      this.selectedCategoryFilter = this.selectedCategoryFilter === event.name ? null : event.name;
      this.applyFilter();
    }
  }

  clearFilter(): void {
    this.selectedCategoryFilter = null;
    this.applyFilter();
  }

  get isMonthlyDataFilteredAndEmpty(): boolean {
    return (
      !!this.selectedCategoryFilter &&
      !(this.displayReportData?.monthly && this.displayReportData.monthly.length > 0)
    );
  }

  public applyFilter(): void {
    if (!this.fullReportData) return;
    let monthlyData: MonthlyData[] = this.fullReportData.monthly || [];
    let expense = this.fullReportData.totalExpense || 0;

    if (this.selectedCategoryFilter) {
      const cat = (this.fullReportData.category || []).find(
        (c: any) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount || 0;
      const monthlyMap = new Map<string, number>();
      (this.fullReportData.detailed_monthly || []).forEach((d: any) => {
        if ((d.category || 'Uncategorized') === this.selectedCategoryFilter) {
          monthlyMap.set(d.month, (monthlyMap.get(d.month) || 0) + d.amount);
        }
      });
      monthlyData = Array.from(monthlyMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }

    this.displayReportData = {
      ...this.fullReportData,
      totalExpense: expense,
      monthly: monthlyData
    };
    this.updateCharts();
    this.cdr.markForCheck();
  }

  public toggleCategoryFilter(category: string): void {
    this.selectedCategoryFilter =
      this.selectedCategoryFilter === category ? null : category;
    this.applyFilter();
  }

  formatAsINR(value: number | undefined | null): string {
    return (value ?? 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  }

  getYearRange(): string {
    const y = this.fullReportData?.year;
    return y?.months && y?.months.length === 12
      ? `${y.months[0]} - ${y.months[11]} ${y.year}`
      : '';
  }

  public getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0) return '0.0';
    return ((categoryAmount / (this.fullReportData.totalExpense || 1)) * 100).toFixed(1);
  }

  /** Compute quarterly bar chart data, with correct padding and filtering for a category. */
  private computeQuarterlyData(data: any[] | undefined, category: string | null): number[] {
    const quarters = [1, 2, 3, 4];
    if (!Array.isArray(data)) return [0, 0, 0, 0];
    return quarters.map(q => {
      if (category) {
        return data
          .filter(item =>
            Number(item.quarter) === q &&
            (item.category || 'Uncategorized') === category
          )
          .reduce((sum, item) => sum + (item.total || 0), 0);
      } else {
        const found = data.find(item => Number(item.quarter) === q);
        return found ? found.total || 0 : 0;
      }
    });
  }

  private updateCharts(): void {
    if (!this.fullReportData || !this.displayReportData) return;

    // Pie (Category breakdown)
    this.pieChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
      },
      series: [{
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          fontSize: 10,
          fontWeight: 500,
          formatter: (params: any) => {
            const value = +params.value || 0;
            return `${params.name}: ₹${value.toLocaleString('en-IN')}`;
          }
        },
        data: (this.fullReportData.category || []).map((c: any) => ({
          name: c.category || 'Uncategorized',
          value: Math.max(0, c.amount || 0),
          selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
        }))
      }]
    };

    // Monthly trend (line)
    const monthlyData = this.displayReportData?.monthly || [];
    this.monthlyTrendOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const val = +(p?.value || 0);
          return `${p.axisValue}: ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
      },
      grid: { top: '10%', left: '8%', right: '8%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: monthlyData.map((m: any) => {
          const [y, mo] = m.month.split('-');
          return formatDate(new Date(+y, +mo - 1, 1), 'MMM', this.locale);
        }),
        axisLabel: { rotate: 0, fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [{
        type: 'line',
        data: monthlyData.map((m: any) => Math.max(0, m.total || 0)),
        itemStyle: { color: '#4f46e5' },
        lineStyle: { width: 2, color: '#4f46e5' },
        smooth: true
      }]
    };

    // Quarterly Bar Chart
    let quarterlyData: number[] = [];
    if (
      this.selectedCategoryFilter &&
      Array.isArray((this.fullReportData as any).detailed_quarterly)
    ) {
      quarterlyData = this.computeQuarterlyData((this.fullReportData as any).detailed_quarterly, this.selectedCategoryFilter);
    } else if (this.fullReportData?.quarterly) {
      quarterlyData = this.computeQuarterlyData(this.fullReportData.quarterly, null);
    } else {
      quarterlyData = [0, 0, 0, 0];
    }

    this.quarterlyBarOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const val = +(p?.value || 0);
          return `${p.axisValue}: ₹${val.toLocaleString('en-IN')}`;
        }
      },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [{
        type: 'bar',
        data: quarterlyData,
        itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40
      }]
    };

    // Year-over-year comparison chart (optional, structure shown previously)
    if (
      this.fullReportData.hasPreviousYearData &&
      this.fullReportData.previousYear
    ) {
      let lastYearValue = this.fullReportData?.previousYear?.totalExpense ?? 0;
      let thisYearValue = this.fullReportData?.totalExpense ?? 0;
      if (this.selectedCategoryFilter) {
        const prev = (this.fullReportData.previousYear.category || []).find(
          (c: any) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        lastYearValue = prev?.amount || 0;
        const curr = (this.fullReportData.category || []).find(
          (c: any) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        thisYearValue = curr?.amount || 0;
      }
      this.comparisonChartOptions = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const arr = Array.isArray(params) ? params : [params];
            return arr
              .map(p => `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`)
              .join('<br>');
          }
        },
        grid: { top: '10%', left: '8%', right: '8%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: ['Previous Year', 'Current Year'] },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) =>
              value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
          }
        },
        series: [{
          type: 'bar',
          data: [
            { value: Math.max(0, lastYearValue), itemStyle: { color: '#9ca3af' } },
            { value: Math.max(0, thisYearValue), itemStyle: { color: '#4f46e5' } }
          ],
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const value = +params.value || 0;
              if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
              return `₹${value.toFixed(0)}`;
            },
            fontSize: 12,
            fontWeight: 'bold'
          }
        }]
      };
    }
  }

  exportToPDF(): void { window.print(); }
  shareReport(): void { /* implement if needed */ }
}
