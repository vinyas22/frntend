import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import * as echarts from 'echarts';
import { NgIconsModule } from '@ng-icons/core';
import { HeroHome, HeroDocumentText, HeroChartPie, HeroBell } from '@ng-icons/heroicons/outline';

import { ReportService } from '../../services/report.service';
import { NotificationService } from '../../services/notification.service';
import { ReportData, WeekPeriod } from '../../reports/models/report.interface';
import { SummaryCardComponent } from '../../reports/summary-card.component';
import { PeriodSelectorComponent } from '../../reports/period-selector.component';
import { SharedModule } from '../../shared/shared.module';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { PercentPipe } from '@angular/common';
import { PercentagePipe } from '../pipes/percentage.pipe';

@Component({
  selector: 'app-weekly-report',
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardComponent,
    PeriodSelectorComponent,
    SharedModule,
    NgIconsModule,
    CurrencyFormatPipe,
    PercentagePipe,
    PercentPipe
  ],
  templateUrl: './weekly-report.component.html',
  styleUrls: ['./weekly-report.component.scss']
})
export class WeeklyReportComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  reportData: ReportData | null = null;
  availableWeeks: WeekPeriod[] = [];
  selectedWeek = '';
  loading = false;
  error: string | null = null;
  selectedCategory: string | null = null;

  categoryChart: echarts.ECharts | null = null;
  dailyChart: echarts.ECharts | null = null;
  comparisonChart: echarts.ECharts | null = null;

  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('comparisonChart') comparisonChartRef!: ElementRef<HTMLDivElement>;

  constructor(
    private reportService: ReportService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAvailableWeeks();
    this.handleRouteParams();
  }

  ngAfterViewInit(): void {
    // Render charts after view initialized and after data is loaded
    if (this.reportData) this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disposeCharts();
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['week']) {
          this.selectedWeek = params['week'];
          this.loadReportData();
        }
      });
  }

  private loadAvailableWeeks(): void {
    this.reportService.getAvailableWeeks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (weeks) => {
          this.availableWeeks = weeks;
          if (!this.selectedWeek && weeks.length > 0) {
            this.selectedWeek = weeks[0].value;
            this.loadReportData();
          }
        },
        error: (error) => {
          this.error = 'Failed to load available weeks';
          this.notificationService.showError('Failed to load available weeks');
          console.error('Error loading weeks:', error);
        }
      });
  }

  onWeekSelected(week: string): void {
    this.selectedWeek = week;
    this.selectedCategory = null;
    this.loadReportData();
  }

  onRefresh(): void {
    this.loadAvailableWeeks();
    if (this.selectedWeek) this.loadReportData();
  }

  private loadReportData(): void {
    if (!this.selectedWeek) return;
    this.loading = true;
    this.error = null;

    this.reportService.getWeeklyReport(this.selectedWeek)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.loading = false;
          this.selectedCategory = null;
          setTimeout(() => this.initializeCharts(), 0); // after DOM is stable
          this.notificationService.showSuccess('Weekly report loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to load weekly report data';
          this.notificationService.showError('Failed to load weekly report');
          console.error('Error loading report:', error);
        }
      });
  }

  get filteredCategories(): any[] {
    if (!this.reportData?.category) return [];
    if (!this.selectedCategory) return this.reportData.category;
    return this.reportData.category.filter(cat => cat.category === this.selectedCategory);
  }

  getFilteredPrevCategories(prevCategories: any[]): any[] {
    if (!this.selectedCategory) return prevCategories;
    return prevCategories.filter(cat => cat.category === this.selectedCategory);
  }

  isFiltered(): boolean {
    return !!this.selectedCategory;
  }

  onCategoryClick(category: string) {
    this.selectedCategory = this.selectedCategory === category ? null : category;
    setTimeout(() => this.initializeCharts(), 0);
  }

  clearCategoryFilter() {
    this.selectedCategory = null;
    setTimeout(() => this.initializeCharts(), 0);
  }

  /*** CHARTS ***/
  private initializeCharts(): void {
    this.initCategoryChart();
    this.initDailyChart();
    this.initComparisonChart();
  }

  private initCategoryChart(): void {
    if (!this.pieChartRef || !this.reportData) return;
    const chartElement = this.pieChartRef.nativeElement;
    const categories = this.filteredCategories;
    if (this.categoryChart) this.categoryChart.dispose();
    this.categoryChart = echarts.init(chartElement);
    if (!categories || categories.length === 0) {
      this.categoryChart.clear();
      return;
    }
    this.categoryChart.setOption({
      title: {
        text: 'Expenses by Category',
        left: 'center',
        textStyle: { color: '#374151', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ₹{c} ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '60%'],
        data: categories.map(cat => ({
          value: cat.amount,
          name: cat.category,
          selected: this.selectedCategory === cat.category
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.5)'
          }
        },
        selectedMode: 'single',
        selectedOffset: 10
      }]
    });
    this.categoryChart.off('click');
    this.categoryChart.on('click', (params: any) => this.onCategoryClick(params.name));
  }

  private initDailyChart(): void {
    if (!this.barChartRef || !this.reportData || !this.reportData.daily) return;
    const chartElement = this.barChartRef.nativeElement;
    if (this.dailyChart) this.dailyChart.dispose();
    this.dailyChart = echarts.init(chartElement);
    let dailySource = this.reportData.daily;
    if (this.selectedCategory && this.reportData.detailed_daily) {
      const dailyMap = new Map<string, number>();
      this.reportData.detailed_daily
        .filter((d: any) => d.category === this.selectedCategory)
        .forEach((d: any) => {
          const existing = dailyMap.get(d.date) || 0;
          dailyMap.set(d.date, existing + d.amount);
        });
      dailySource = Array.from(dailyMap.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    this.dailyChart.setOption({
      title: {
        text: this.selectedCategory
          ? `Daily Expenses - ${this.selectedCategory}`
          : 'Daily Expenses',
        left: 'center',
        textStyle: { color: '#374151', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          return `${params[0].name}: ₹${params[0].value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: dailySource.map(d => new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }))
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '₹{value}' }
      },
      series: [{
        name: 'Daily Expense',
        type: 'bar',
        data: dailySource.map(d => d.total),
        itemStyle: { color: '#3B82F6' }
      }]
    });
  }

  private initComparisonChart(): void {
    if (!this.comparisonChartRef || !this.reportData || !this.reportData.previousWeek) return;
    const chartElement = this.comparisonChartRef.nativeElement;
    if (this.comparisonChart) this.comparisonChart.dispose();
    this.comparisonChart = echarts.init(chartElement);
    const currentCategories = this.reportData.category || [];
    const previousCategories = this.reportData.previousWeek.category || [];
    const categories = [
      ...new Set([
        ...currentCategories.map(c => c.category || 'Uncategorized'),
        ...previousCategories.map(c => c.category || 'Uncategorized')
      ])
    ];
    this.comparisonChart.setOption({
      title: {
        text: this.selectedCategory
          ? `Week Comparison - ${this.selectedCategory}`
          : 'Week-over-Week Comparison',
        left: 'center',
        textStyle: { color: '#374151', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Current Week', 'Previous Week'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '₹{value}' }
      },
      series: [
        {
          name: 'Current Week',
          type: 'bar',
          data: categories.map(catName => {
            const found = currentCategories.find(c => (c.category || 'Uncategorized') === catName);
            return found ? found.amount : 0;
          }),
          itemStyle: { color: '#3B82F6' }
        },
        {
          name: 'Previous Week',
          type: 'bar',
          data: categories.map(catName => {
            const found = previousCategories.find(c => (c.category || 'Uncategorized') === catName);
            return found ? found.amount : 0;
          }),
          itemStyle: { color: '#9CA3AF' }
        }
      ]
    });
  }

  private disposeCharts(): void {
    this.categoryChart?.dispose?.();
    this.categoryChart = null;
    this.dailyChart?.dispose?.();
    this.dailyChart = null;
    this.comparisonChart?.dispose?.();
    this.comparisonChart = null;
  }

  findCategoryAmount(arr: any[] | undefined, category: string): number {
    if (!arr) return 0;
    return arr.find(c => c.category === category)?.amount ?? 0;
  }
  getCategoryChange(current: any, prevList: any[]): number {
    const previous = prevList?.find(c => c.category === current.category)?.amount ?? 0;
    if (previous === 0) return current.amount === 0 ? 0 : 100;
    return ((current.amount - previous) / Math.abs(previous)) * 100;
  }
  get expenseComparison(): number | undefined {
    if (!this.reportData?.previousWeek) return undefined;
    const current = this.selectedCategory
      ? this.filteredCategories[0]?.amount ?? 0
      : this.reportData.totalExpense;
    const previous = this.selectedCategory
      ? this.reportData.previousWeek.category?.find(c => c.category === this.selectedCategory)?.amount ?? 0
      : this.reportData.previousWeek.totalExpense;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }
}
