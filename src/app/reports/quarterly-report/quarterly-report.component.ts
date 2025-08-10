import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { ReportService } from '../../services/report.service';
import { QuarterPeriod, ReportData } from '../../reports/models/report.interface';

@Component({
  selector: 'app-quarterly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
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

  pieChartOptions: EChartsOption = {};
  barChartOptions: EChartsOption = {};
  comparisonChartOptions: EChartsOption = {};

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAvailableQuarters();
    if (this.quarterOptions.length > 0 && !this.selectedQuarter) {
      this.selectedQuarter = this.quarterOptions[0].value;
    }
    if (this.selectedQuarter) {
      this.loadReport();
    }
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
        value: `${year}-Q${quarter}`,
        year: year,
        quarter: quarter,
        entryCount: 0,
        totalAmount: 0
      });
    }
    return quarters;
  }

  async loadReport(): Promise<void> {
    if (!this.selectedQuarter) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedCategoryFilter = null;
    try {
      const report = await this.reportService.getQuarterlyReport(this.selectedQuarter).toPromise();
      this.fullReportData = report ?? null;
      this.applyFilter();
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Failed to load quarterly report.';
      this.fullReportData = null;
      this.displayReportData = null;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onQuarterChange(): void {
    if (this.selectedQuarter) this.loadReport();
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
      const cat = (this.fullReportData.category || []).find(
        c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount || 0;
      const dailyMap = new Map<string, number>();
      (this.fullReportData.detailed_daily || [])
        .filter(d => (d.category || 'Uncategorized') === this.selectedCategoryFilter)
        .forEach(d => dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.amount));
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

    // Pie
    this.pieChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) =>
          `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
      },
      series: [{
        type: 'pie',
        radius: ['20%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          formatter: (params: any) => {
            const value = +params.value || 0;
            return `${params.name}: ₹${value.toLocaleString('en-IN')}`;
          }
        },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' }},
        data: (this.fullReportData.category || []).map(c => ({
          name: c.category || 'Uncategorized',
          value: Math.max(0, c.amount || 0),
          selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
        }))
      }]
    };

    // Bar (daily)
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
      grid: { top: '10%', left: '8%', right: '8%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale)),
        axisLabel: { rotate: 45, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [{
        type: 'bar',
        data: dailyData.map(d => Math.max(0, d.total || 0)),
        itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }
      }]
    };

    // Comparison
    if (this.fullReportData.previousQuarter) {
      const prevCatList = this.fullReportData.previousQuarter.category || [];
      let lastQuarterValue = this.fullReportData.previousQuarter.totalExpense || 0;
      let thisQuarterValue = this.fullReportData.totalExpense || 0;
      if (this.selectedCategoryFilter) {
        const prev = prevCatList.find(
          c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        lastQuarterValue = prev?.amount || 0;
        const curr = (this.fullReportData.category || []).find(
          c => (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        thisQuarterValue = curr?.amount || 0;
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
        xAxis: { type: 'category', data: ['Previous Quarter', 'Current Quarter'] },
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
            { value: Math.max(0, lastQuarterValue), itemStyle: { color: '#9ca3af' } },
            { value: Math.max(0, thisQuarterValue), itemStyle: { color: '#4f46e5' } }
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

  // ===== Template helpers =====

  formatAsINR(value: number): string {
    return (value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  }
  getQuarterRange(): string {
    if (!this.fullReportData?.quarter) return '';
    // quarter will have months and year
    const q: any = this.fullReportData.quarter;
    return q?.months && q.months.length === 3 ? `${q.months[0]} - ${q.months[2]} ${q.year}` : '';
  }
  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0) return '0.0';
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }
}
