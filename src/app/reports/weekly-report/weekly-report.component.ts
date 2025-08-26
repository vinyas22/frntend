import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import * as echarts from 'echarts';
import { ReportService } from '../../services/report.service';
import { ReportData, WeekPeriod, CategoryTotal, DailyTotal, DetailedDaily } from '../../reports/models/report.interface';
import { SummaryCardComponent } from '../../reports/summary-card.component';
import { PeriodSelectorComponent } from '../../reports/period-selector.component';
import { SharedModule } from '../../shared/shared.module';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { PercentagePipe } from '../pipes/percentage.pipe';
import { ThemeService } from '../../services/ThemeService';

@Component({
  selector: 'app-weekly-report',
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardComponent,
    PeriodSelectorComponent,
    SharedModule,
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
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
darkMode = false;
themeSubscription: Subscription | null = null;

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef, private themeService: ThemeService
  ) {}

  ngOnInit(): void {
  // Subscribe to theme changes
  this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
    this.darkMode = isDark;
    // Reinitialize charts with proper theme colors on theme change
    this.initializeCharts();
  });

  this.loadAvailableWeeks();
  this.handleRouteParams();
}

  ngAfterViewInit(): void {
    if (this.reportData) this.initializeCharts();
    window.addEventListener('resize', this.onResizeCharts);
  }
ngOnDestroy(): void {
  this.themeSubscription?.unsubscribe();
  window.removeEventListener('resize', this.onResizeCharts);
  this.destroy$.next();
  this.destroy$.complete();
  this.disposeCharts();
}

  private onResizeCharts = () => {
    this.categoryChart?.resize();
    this.dailyChart?.resize();
  };

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
          setTimeout(() => this.initializeCharts(), 0);
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to load weekly report data';
          console.error('Error loading report:', error);
        }
      });
  }

  get filteredCategories(): CategoryTotal[] {
    if (!this.reportData?.category) return [];
    if (!this.selectedCategory) return this.reportData.category;
    return this.reportData.category.filter((cat: CategoryTotal) => cat.category === this.selectedCategory);
  }

  get filteredExpense(): number {
    if (!this.selectedCategory || !this.reportData?.category) return 0;
    const categoryData = this.reportData.category.find(
      (c: CategoryTotal) => (c.category || 'Uncategorized') === this.selectedCategory
    );
    return categoryData?.amount ?? 0;
  }

  getFilteredPrevCategories(prevCategories: CategoryTotal[] = []): CategoryTotal[] {
    if (!this.selectedCategory) return prevCategories;
    return prevCategories.filter((cat: CategoryTotal) => cat.category === this.selectedCategory);
  }

  isFiltered(): boolean {
    return !!this.selectedCategory;
  }

  onCategoryClick(category: string) {
    this.selectedCategory = this.selectedCategory === category ? null : category;
    this.cdr.detectChanges();
    setTimeout(() => this.initializeCharts(), 100);
  }

  clearCategoryFilter() {
    this.selectedCategory = null;
    this.cdr.detectChanges();
    setTimeout(() => this.initializeCharts(), 100);
  }

  getDailyBreakdownData(): any[] {
  if (!this.selectedCategory || !this.reportData) return [];
  const allDates = new Set<string>();

  // Current week filtered by selectedCategory (safe optional chaining)
  const currentWeekFiltered = this.reportData.detailed_daily?.filter(
    (d: DetailedDaily) => d.category === this.selectedCategory
  ) || [];
  currentWeekFiltered.forEach((d: DetailedDaily) => allDates.add(d.date));

  // Previous week robust handling with null checks
  let previousWeekFiltered: DetailedDaily[] = [];
  if (this.reportData.previousWeek?.detailed_daily) {
    previousWeekFiltered = this.reportData.previousWeek.detailed_daily.filter(
      (d: DetailedDaily) => d.category === this.selectedCategory
    );
    previousWeekFiltered.forEach((d: DetailedDaily) => allDates.add(d.date));
  } else if (this.reportData.previousWeek?.daily && this.reportData.previousWeek?.category) {
    // Fallback path: get all dates from previousWeek.daily safely
    this.reportData.previousWeek.daily.forEach((d: DailyTotal) => allDates.add(d.date));
  }

  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map(date => {
    const currentAmount = this.reportData?.detailed_daily
      ?.filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory)
      ?.reduce((sum, d) => sum + (d.amount || 0), 0) ?? 0;

    let previousAmount = 0;
if (this.reportData?.previousWeek?.detailed_daily) {
  previousAmount = this.reportData.previousWeek.detailed_daily
    .filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
} else if (this.reportData?.previousWeek?.daily && this.reportData.previousWeek?.category) {
  const categoryTotal = this.reportData.previousWeek.category
    ?.find((c: CategoryTotal) => c.category === this.selectedCategory)?.amount ?? 0;
  const dailyTotal = this.reportData.previousWeek.daily
    ?.find((d: DailyTotal) => d.date === date)?.total ?? 0;
  const weekTotal = this.reportData.previousWeek.daily
    ?.reduce((sum, d) => sum + d.total, 0) ?? 0;

  if (categoryTotal > 0 && dailyTotal > 0 && weekTotal > 0) {
    previousAmount = (categoryTotal / weekTotal) * dailyTotal;
  }
}


    const difference = currentAmount - previousAmount;
    const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'long' });

    return { date, dayName, currentAmount, previousAmount, difference };
  });
}


  getDailyBreakdownTotals() {
    const dailyData = this.getDailyBreakdownData();
    const currentTotal = dailyData.reduce((sum, day) => sum + day.currentAmount, 0);
    const previousTotal = dailyData.reduce((sum, day) => sum + day.previousAmount, 0);
    const totalDifference = currentTotal - previousTotal;
    return { currentTotal, previousTotal, totalDifference };
  }

  private initializeCharts(): void {
    this.initCategoryChart();
    this.initDailyChart();
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
    backgroundColor: this.darkMode ? '#232a37' : '#fff',
    title: {
      text: 'Expenses by Category',
      left: 'center',
      textStyle: { 
        color: this.darkMode ? '#e9eaf0' : '#374151', 
        fontSize: 16, 
        fontWeight: 'bold' 
      }
    },
 tooltip: {
  trigger: 'item',
  formatter: '{a} {b}: ₹{c} ({d}%)',
  textStyle: { color: this.darkMode ? '#e9eaf0' : '#374151' },
  backgroundColor: this.darkMode ? '#232a37' : '#fff',
  borderColor: this.darkMode ? '#556080' : '#eceef1',
}
,
    legend: {
  show: false
}
,
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
          shadowColor: this.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
        }
      },
      selectedMode: 'single',
      selectedOffset: 10
    }]
  });

  this.categoryChart.off('click');
  this.categoryChart.on('click', params => {
    if (params && params.name) this.onCategoryClick(params.name);
  });

  this.categoryChart.resize();
}

 private initDailyChart(): void {
    if (!this.barChartRef || !this.reportData) return;
    const chartElement = this.barChartRef.nativeElement;
    if (this.dailyChart) this.dailyChart.dispose();

    this.dailyChart = echarts.init(chartElement);

    let dailySource = this.reportData.daily ?? [];
    if (this.selectedCategory && this.reportData.detailed_daily) {
      const dailyMap = new Map<string, number>();
      this.reportData.detailed_daily
        .filter(d => d.category === this.selectedCategory)
        .forEach(d => {
          dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + (d.amount ?? 0));
        });
      dailySource = Array.from(dailyMap.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    if (dailySource.length === 0) {
      this.dailyChart.clear();
      return;
    }

    this.dailyChart.setOption({
      backgroundColor: this.darkMode ? '#232a37' : '#fff',
      title: {
        text: this.selectedCategory ? `Daily Expenses - ${this.selectedCategory}` : 'Daily Expenses',
        left: 'center',
        textStyle: { color: this.darkMode ? '#e9eaf0' : '#374151', fontSize: 16, fontWeight: 'bold' }
      },
    tooltip: {
  trigger: 'axis',
  backgroundColor: this.darkMode ? 'rgba(35,42,55,0.9)' : '#fff',
  borderColor: this.darkMode ? '#556080' : '#eceef1',
  borderWidth: 1,
  formatter: (params: any): string => {
    if (Array.isArray(params)) {
      return `${params[0].name}: ₹${params[0].value}`;
    }
    return '';
  },
  textStyle: {
    color: this.darkMode ? '#e9eaf0' : '#374151'
  }
}
,

      xAxis: {
        type: 'category',
        data: dailySource.map(d => 
          new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })),
        axisLabel: { color: this.darkMode ? '#e9eaf0' : '#374151' },
        axisLine: { lineStyle: { color: this.darkMode ? '#556080' : '#e5e7eb' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '₹{value}', color: this.darkMode ? '#e9eaf0' : '#374151' },
        axisLine: { lineStyle: { color: this.darkMode ? '#556080' : '#e5e7eb' } },
        splitLine: { lineStyle: { color: this.darkMode ? '#33415c' : '#f3f4f6' } }
      },
      series: [{
        name: 'Daily Expense',
        type: 'bar',
        data: dailySource.map(d => d.total),
        itemStyle: { color: '#3B82F6' }
      }]
    });

    this.dailyChart.resize();
  }







  private disposeCharts(): void {
    this.categoryChart?.dispose?.();
    this.categoryChart = null;
    this.dailyChart?.dispose?.();
    this.dailyChart = null;
  }

  // Safe percent calculation for display
  get expenseComparison(): number | undefined {
    if (!this.reportData?.previousWeek) return undefined;
    const current = this.selectedCategory
      ? this.filteredCategories[0]?.amount ?? 0
      : this.reportData.totalExpense ?? 0;
    const previous = this.selectedCategory
      ? this.reportData.previousWeek.category?.find((c: CategoryTotal) => c.category === this.selectedCategory)?.amount ?? 0
      : this.reportData.previousWeek.totalExpense ?? 0;
    if (previous === undefined || previous === null || previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
  }

  findCategoryAmount(arr: CategoryTotal[] = [], category: string): number {
  if (!arr) return 0;
  const found = arr.find(c => c.category === category);
  return found ? found.amount : 0;
}

getCategoryChange(current: CategoryTotal, prevList: CategoryTotal[] = []): number {
  const previous = prevList.find(c => c.category === current.category)?.amount ?? 0;
  if (previous === 0) {
    return current.amount === 0 ? 0 : 100; // Consider 100% change from zero
  }
  return ((current.amount - previous) / Math.abs(previous)) * 100;
}
}
