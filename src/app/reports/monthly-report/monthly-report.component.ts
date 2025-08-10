import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { SharedModule } from '../../shared/shared.module';
import {
  ReportService
} from '../../services/report.service';
import {
  ReportData,
  CategoryData,
  DailyData,
  DetailedDailyData
} from '../../reports/models/report.interface'; // update this path according to your setup

@Component({
  selector: 'app-monthly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, SharedModule],
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
      const report: ReportData = await firstValueFrom(
        this.reportService.getMonthlyReport(dateForApi)
      );
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

  get isDailySpendFilteredAndEmpty(): boolean {
    return !!this.selectedCategoryFilter && (!this.displayReportData?.daily?.length);
  }

  public applyFilter(): void {
    if (!this.fullReportData) return;
    this.isFilterLoading = true;

    let dailyData = this.fullReportData.daily || [];
    let expense = this.fullReportData.totalExpense;

    if (this.selectedCategoryFilter) {
      // Get selected category object
      const cat = (this.fullReportData.category || []).find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount || 0;

      // Filter daily for this category
      const dailyMap = new Map<string, number>();
      (this.fullReportData.detailed_daily || []).forEach(d => {
        if ((d.category || 'Uncategorized') === this.selectedCategoryFilter) {
          dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.amount);
        }
      });
      dailyData = Array.from(dailyMap.entries())
        .map(([date, amount]) => ({ date, total: amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    this.displayReportData = {
      ...this.fullReportData,
      totalExpense: expense,
      daily: dailyData
    };

    this.updateCharts();
    this.isFilterLoading = false;
    this.cdr.markForCheck();
  }

  private updateCharts(): void {
    if (!this.fullReportData || !this.displayReportData) return;

    // Pie Chart: ALL categories (filter highlight)
    this.pieChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) =>
          `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
      },
      series: [
        {
          type: 'pie',
          radius: ['30%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: (params: any) => {
              const value = +params.value || 0;
              return `${params.name}: ₹${value.toLocaleString('en-IN')}`;
            },
            fontSize: 10,
            fontWeight: 500,
            overflow: 'break'
          },
          labelLine: { show: true, length: 10, length2: 15, smooth: true },
          emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
          data: (this.fullReportData.category || []).map(c => ({
            name: c.category || 'Uncategorized',
            value: Math.max(0, c.amount || 0),
            selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
          }))
        }
      ]
    };

    // Bar Chart: Only display data from selected or all
    const dailyData = this.displayReportData.daily || [];
    this.barChartOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const val = +(p?.value || 0);
          return `${p.axisValue}: ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
      },
      grid: {
        top: '10%',
        left: '8%',
        right: '8%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale)),
        axisLabel: { rotate: 45, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [
        {
          type: 'bar',
          data: dailyData.map(d => Math.max(0, d.total || 0)),
          itemStyle: {
            color: '#4f46e5',
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };

    // Month Comparison Chart
    if (this.fullReportData.previousMonth) {
      const prevCatList = this.fullReportData.previousMonth.category || [];
      let lastMonthValue = this.fullReportData.previousMonth.totalExpense || 0;
      let thisMonthValue = this.fullReportData.totalExpense || 0;

      if (this.selectedCategoryFilter) {
        const prev = prevCatList.find(
          c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        lastMonthValue = prev?.amount || 0;
        const curr = (this.fullReportData.category || []).find(
          c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        thisMonthValue = curr?.amount || 0;
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
        grid: {
          top: '10%',
          left: '8%',
          right: '8%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: { type: 'category', data: ['Last Month', 'This Month'] },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) =>
              value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
          }
        },
        series: [
          {
            type: 'bar',
            data: [
              { value: Math.max(0, lastMonthValue), itemStyle: { color: '#9ca3af' } },
              { value: Math.max(0, thisMonthValue), itemStyle: { color: '#4f46e5' } }
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
          }
        ]
      };
    }
  }

  formatAsINR(value: number): string {
    return (value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  }

  getMonthName(): string {
    if (!this.selectedMonth) return '';
    const [year, month] = this.selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return formatDate(date, 'MMMM yyyy', this.locale);
  }

  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0) {
      return '0.0';
    }
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }
}
