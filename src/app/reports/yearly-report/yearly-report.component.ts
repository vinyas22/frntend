import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  LOCALE_ID,
  ChangeDetectionStrategy,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption, SeriesOption } from 'echarts';
import * as echarts from 'echarts/core';
import { ReportService } from '../../services/report.service';
import { YearPeriod, ReportData } from '../../reports/models/report.interface';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-yearly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  providers: [{ provide: NGX_ECHARTS_CONFIG, useValue: { echarts } }],
  templateUrl: './yearly-report.component.html',
  styleUrls: ['./yearly-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearlyReportComponent implements OnInit {
  selectedYear = '';
  yearOptions: YearPeriod[] = [];
  isLoading = false;
  isFilterLoading = false;
  isLoadingYears = false;
  errorMessage: string | null = null;

  fullReportData: ReportData | null = null;
  displayReportData: ReportData | null = null;
  selectedCategoryFilter: string | null = null;

  pieChartOptions: EChartsOption = {};
  monthlyTrendOptions: EChartsOption = {};
  quarterlyChartOptions: EChartsOption = {};
  yearComparisonOptions: EChartsOption = {};

  isDarkMode = false;

  private filterTimeout: any;

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string,
    private renderer: Renderer2
  ) {}


  ngOnInit(): void {
    this.isDarkMode = false; // default light mode
    this.updateGlobalDarkModeClass();
    this.loadAvailableYears().then(() => {
      if (this.yearOptions.length > 0 && !this.selectedYear) {
        this.selectedYear = this.yearOptions[0].value;
      }
      if (this.selectedYear) {
        this.loadReport();
      }
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.updateGlobalDarkModeClass();
    this.updateCharts();
  }

  private updateGlobalDarkModeClass(): void {
    const root = document.body;
    if (this.isDarkMode) {
      this.renderer.addClass(root, 'dark-mode');
    } else {
      this.renderer.removeClass(root, 'dark-mode');
    }
  }

  async loadAvailableYears(): Promise<void> {
    this.isLoadingYears = true;
    this.errorMessage = null;
    try {
      const years = await this.reportService.getAvailableYears().toPromise();
      this.yearOptions = years ?? [];
      if (this.yearOptions.length === 0) {
        this.errorMessage =
          'No expense data found. Please add some expenses to generate yearly reports.';
      }
    } catch (error: any) {
      this.errorMessage =
        'Failed to load available years. Please try again.';
      this.yearOptions = this.generateFallbackYears();
    } finally {
      this.isLoadingYears = false;
      this.cdr.markForCheck();
    }
  }

  private generateFallbackYears(): YearPeriod[] {
    const currentYear = new Date().getFullYear();
    const years: YearPeriod[] = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({
        year,
        label: `${year}`,
        value: `${year}-01-01`,
        entryCount: 0,
        totalAmount: 0,
      });
    }
    return years;
  }

  async loadReport(): Promise<void> {
    if (!this.selectedYear) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedCategoryFilter = null;
    try {
      const report = await this.reportService.getYearlyReport(this.selectedYear).toPromise();
      this.fullReportData = report ?? null;
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
    if (this.selectedYear) {
      this.loadReport();
    }
  }

  onChartClick(event: any): void {
    if (event.seriesType === 'pie' && event.name) {
      this.selectedCategoryFilter =
        this.selectedCategoryFilter === event.name ? null : event.name;
      this.applyFilterWithDebounce();
    }
  }

  toggleCategoryFilter(category: string): void {
    this.selectedCategoryFilter =
      this.selectedCategoryFilter === category ? null : category;
    this.applyFilterWithDebounce();
  }

  clearFilter(): void {
    this.selectedCategoryFilter = null;
    this.applyFilterWithDebounce();
  }

  applyFilterWithDebounce(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.isFilterLoading = true;
    this.filterTimeout = setTimeout(() => {
      this.applyFilter();
    }, 150);
  }

  applyFilter(): void {
    if (!this.fullReportData) return;
    let expense = this.fullReportData.totalExpense || 0;
    if (this.selectedCategoryFilter) {
      const cat = (this.fullReportData.category || []).find(
        (c) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount || 0;
    }
    this.displayReportData = {
      ...this.fullReportData,
      totalExpense: expense,
    };
    this.updateCharts();
    this.isFilterLoading = false;
    this.cdr.detectChanges();
  }

  private updateCharts(): void {
    if (!this.fullReportData || !this.displayReportData) return;
    const bgColor = this.isDarkMode ? '#121212' : '#ffffff';
    const textColor = this.isDarkMode ? '#e0e0e0' : '#1e293b';

    this.pieChartOptions = {
      backgroundColor: bgColor,
      animation: true,
      animationDuration: 400,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 400,
      animationEasingUpdate: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: this.isDarkMode ? '#333' : undefined,
        textStyle: { color: textColor },
        formatter: (p: any) =>
          `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { fontSize: 12, color: textColor },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false, color: textColor },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: textColor,
            },
          },
          data: (this.fullReportData.category || []).map((c) => ({
            name: c.category || 'Uncategorized',
            value: Math.max(0, c.amount || 0),
            selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter,
          })),
        } as SeriesOption,
      ],
    };

    const monthlyData = this.getMonthlyBreakdownData();
    this.monthlyTrendOptions = {
      backgroundColor: bgColor,
      animation: true,
      animationDuration: 400,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 400,
      animationEasingUpdate: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        backgroundColor: this.isDarkMode ? '#333' : undefined,
        textStyle: { color: textColor },
        formatter: (params: any) => {
          const arr = Array.isArray(params) ? params : [params];
          return arr
            .map(
              (p) =>
                `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`
            )
            .join('<br>');
        },
      },
      legend: {
        data: ['Current Year', 'Previous Year'],
        textStyle: { color: textColor },
      },
      grid: {
        top: '15%',
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map((m) => m.monthName),
        axisLine: { lineStyle: { color: textColor } },
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`,
        },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: {
          lineStyle: {
            color: this.isDarkMode ? '#444' : '#eee',
          },
        },
      },
      series: [
        {
          name: 'Current Year',
          type: 'line' as const,
          data: monthlyData.map((m) => m.currentAmount),
          itemStyle: { color: '#4f46e5' },
          smooth: true,
        },
        ...(this.fullReportData.previousYear
          ? [
              {
                name: 'Previous Year',
                type: 'line' as const,
                data: monthlyData.map((m) => m.previousAmount),
                itemStyle: { color: '#9ca3af' },
                smooth: true,
              },
            ]
          : []),
      ],
    };

    let quarterlyData = this.fullReportData.quarterly || [];
    if (this.selectedCategoryFilter) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      quarterlyData = quarters
        .map((quarterName) => {
          const quarterlyTotal = this.getQuarterlyAmountForCategory(
            quarterName,
            this.selectedCategoryFilter!
          );
          return {
            quarter: quarterName,
            total: quarterlyTotal,
          };
        })
        .filter((q) => q.total > 0);
    }
    this.quarterlyChartOptions = {
      backgroundColor: bgColor,
      animation: true,
      animationDuration: 400,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 400,
      animationEasingUpdate: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        backgroundColor: this.isDarkMode ? '#333' : undefined,
        textStyle: { color: textColor },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`;
        },
      },
      grid: {
        top: '10%',
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: quarterlyData.map((q) => q.quarter),
        axisLine: { lineStyle: { color: textColor } },
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`,
        },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: {
          lineStyle: {
            color: this.isDarkMode ? '#444' : '#eee',
          },
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: quarterlyData.map((q) => q.total),
          itemStyle: {
            color: '#4f46e5',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };

    if (this.fullReportData.previousYear) {
      const currentCategories = this.fullReportData.category || [];
      const previousCategories = this.fullReportData.previousYear.category || [];
      let topCategories: any[];
      if (this.selectedCategoryFilter) {
        const currentCat = currentCategories.find(
          (c) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        topCategories = currentCat ? [currentCat] : [];
      } else {
        topCategories = currentCategories.slice(0, 5);
      }
      this.yearComparisonOptions = {
        backgroundColor: bgColor,
        animation: true,
        animationDuration: 400,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 400,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          backgroundColor: this.isDarkMode ? '#333' : undefined,
          textStyle: { color: textColor },
          formatter: (params: any) => {
            const arr = Array.isArray(params) ? params : [params];
            return arr
              .map(
                (p) =>
                  `${p.seriesName}: ₹${(+p.value || 0).toLocaleString('en-IN')}`
              )
              .join('<br>');
          },
        },
        legend: {
          data: ['Current Year', 'Previous Year'],
          textStyle: { color: textColor },
        },
        grid: {
          top: '15%',
          left: '10%',
          right: '10%',
          bottom: '25%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: topCategories.map((c) => c.category || 'Uncategorized'),
          axisLabel: { rotate: 45, color: textColor },
          axisLine: { lineStyle: { color: textColor } },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: textColor,
            formatter: (value: number) =>
              value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`,
          },
          axisLine: { lineStyle: { color: textColor } },
          splitLine: {
            lineStyle: {
              color: this.isDarkMode ? '#444' : '#eee',
            },
          },
        },
        series: [
          {
            name: 'Current Year',
            type: 'bar' as const,
            data: topCategories.map((c) => c.amount),
            itemStyle: { color: '#4f46e5' },
          },
          {
            name: 'Previous Year',
            type: 'bar' as const,
            data: topCategories.map((c) => {
              const prevCat = previousCategories.find(
                (pc) => (pc.category || 'Uncategorized') === (c.category || 'Uncategorized')
              );
              return prevCat?.amount || 0;
            }),
            itemStyle: { color: '#9ca3af' },
          },
        ] as SeriesOption[],
      };
    }
  }

  getPreviousYearExpense(): number {
    return this.fullReportData?.previousYear?.totalExpense || 0;
  }

  getIncomeChange(): number {
    const current = this.fullReportData?.totalIncome || 0;
    const previous = this.fullReportData?.previousYear?.totalIncome || 0;
    return current - previous;
  }

  getExpenseChange(): number {
    const current = this.displayReportData?.totalExpense || 0;
    const previous = this.getPreviousYearExpense();
    return current - previous;
  }

  getSavingsChange(): number {
    const current = this.fullReportData?.savings || 0;
    const previous = this.fullReportData?.previousYear?.savings || 0;
    return current - previous;
  }

  getPreviousAmount(category: string): number {
    if (!this.fullReportData?.previousYear?.category) return 0;
    const found = this.fullReportData.previousYear.category.find(
      (c) => (c.category || 'Uncategorized') === category
    );
    return found?.amount || 0;
  }

  getCategoryChangeAmount(category: string): number {
    const current =
      this.fullReportData?.category?.find(
        (c) => (c.category || 'Uncategorized') === category
      )?.amount || 0;
    const previous = this.getPreviousAmount(category);
    return current - previous;
  }

  getCategoryTotalForYear(): number {
    if (!this.selectedCategoryFilter || !this.fullReportData?.category)
      return 0;
    const found = this.fullReportData.category.find(
      (c) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
    );
    return found?.amount || 0;
  }

  private getQuarterlyAmountForCategory(
    quarterName: string,
    category: string
  ): number {
    if (!this.fullReportData?.detailed_monthly) return 0;
    const quarterMonths: { [key: string]: number[] } = {
      Q1: [1, 2, 3],
      Q2: [4, 5, 6],
      Q3: [7, 8, 9],
      Q4: [10, 11, 12],
    };
    const months = quarterMonths[quarterName] || [];
    const year = this.fullReportData?.year?.year || new Date().getFullYear();
    return months.reduce((total, month) => {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const amount = this.getCategoryAmountForMonth(monthKey, category);
      return total + amount;
    }, 0);
  }

  getMonthlyBreakdownData(): any[] {
    if (!this.fullReportData?.monthly) return [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months.map((monthName, index) => {
      const monthKey = `${this.fullReportData?.year?.year ||
        new Date().getFullYear()}-${String(index + 1).padStart(2, '0')}`;
      const currentMonth = this.fullReportData?.monthly?.find(
        (m) => m.month === monthKey
      );
      const previousMonth = this.fullReportData?.previousYear?.monthly?.find(
        (m) => m.month.endsWith(`-${String(index + 1).padStart(2, '0')}`)
      );
      const currentAmount = this.selectedCategoryFilter
        ? this.getCategoryAmountForMonth(monthKey, this.selectedCategoryFilter)
        : currentMonth?.total || 0;
      const previousAmount = this.selectedCategoryFilter
        ? this.getPreviousCategoryAmountForMonth(
            index + 1,
            this.selectedCategoryFilter
          )
        : previousMonth?.total || 0;
      return {
        monthName,
        monthKey,
        currentAmount,
        previousAmount,
        difference: currentAmount - previousAmount,
      };
    });
  }

  getDetailedMonthlyData(): any[] {
    if (!this.selectedCategoryFilter) return [];
    return this.getMonthlyBreakdownData().filter(
      (month) => month.currentAmount > 0 || month.previousAmount > 0
    );
  }

  private getCategoryAmountForMonth(monthKey: string, category: string): number {
    if (!this.fullReportData?.detailed_monthly) return 0;
    const found = this.fullReportData.detailed_monthly.find(
      (dm) => dm.month === monthKey && (dm.category || 'Uncategorized') === category
    );
    return found?.amount || 0;
  }

  private getPreviousCategoryAmountForMonth(
    monthNumber: number,
    category: string
  ): number {
    if (!this.fullReportData?.previousYear?.detailed_monthly) return 0;
    const monthKey = `${this.fullReportData?.previousYear?.year ||
      new Date().getFullYear() - 1}-${String(monthNumber).padStart(2, '0')}`;
    const found = this.fullReportData.previousYear.detailed_monthly.find(
      (dm) => dm.month === monthKey && (dm.category || 'Uncategorized') === category
    );
    return found?.amount || 0;
  }

  formatAsINR(value: number): string {
    return (value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  getYearRange(): string {
    if (!this.fullReportData?.year) return '';
    return this.fullReportData.year.label || `${this.fullReportData.year.year}`;
  }

  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0)
      return '0.0';
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }
  
}
