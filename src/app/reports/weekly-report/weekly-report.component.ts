import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import * as echarts from 'echarts';

import { ReportService } from '../../services/report.service';
import { NotificationService } from '../../services/notification.service';
import { ReportData, WeekPeriod, CategoryTotal, DailyTotal, DetailedDaily } from '../../reports/models/report.interface';
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

  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLDivElement>;

  constructor(
    private reportService: ReportService,
    // private notificationService: NotificationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvailableWeeks();
    this.handleRouteParams();
  }

  ngAfterViewInit(): void {
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
          // this.notificationService.showError('Failed to load available weeks');
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
          // this.notificationService.showSuccess('Weekly report loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to load weekly report data';
          // this.notificationService.showError('Failed to load weekly report');
          console.error('Error loading report:', error);
        }
      });
  }

  // ✅ FIXED: Proper type safety with CategoryTotal[]
  get filteredCategories(): CategoryTotal[] {
    console.log('🔍 Getting filtered categories. selectedCategory:', this.selectedCategory);
    console.log('🔍 Available categories:', this.reportData?.category?.map((c: CategoryTotal) => c.category));
    
    if (!this.reportData?.category) return [];
    if (!this.selectedCategory) return this.reportData.category;
    
    const filtered = this.reportData.category.filter((cat: CategoryTotal) => cat.category === this.selectedCategory);
    console.log('🔍 Filtered result:', filtered);
    return filtered;
  }

  // ✅ ADDED MISSING PROPERTY: filteredExpense getter
  get filteredExpense(): number {
    if (!this.selectedCategory || !this.reportData?.category) {
      return 0;
    }
    
    const categoryData = this.reportData.category.find(
      (c: CategoryTotal) => (c.category || 'Uncategorized') === this.selectedCategory
    );
    
    return categoryData?.amount ?? 0;
  }

  // ✅ FIXED: Proper typing for parameters
  getFilteredPrevCategories(prevCategories: CategoryTotal[]): CategoryTotal[] {
    if (!this.selectedCategory) return prevCategories;
    return prevCategories.filter((cat: CategoryTotal) => cat.category === this.selectedCategory);
  }

  isFiltered(): boolean {
    return !!this.selectedCategory;
  }

  onCategoryClick(category: string) {
    console.log('🔍 Category clicked:', category);
    console.log('🔍 Current selectedCategory:', this.selectedCategory);
    
    this.selectedCategory = this.selectedCategory === category ? null : category;
    
    console.log('🔍 New selectedCategory:', this.selectedCategory);
    
    if (this.selectedCategory) {
      this.debugPreviousWeekData();
    }
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      console.log('🔍 Re-initializing charts...');
      this.initializeCharts();
    }, 100);
  }

  clearCategoryFilter() {
    this.selectedCategory = null;
    this.cdr.detectChanges();
    setTimeout(() => this.initializeCharts(), 100);
  }

  /**
   * ✅ DEBUG METHOD: Check previous week data structure with proper typing
   */
  debugPreviousWeekData() {
    console.log('=== DEBUGGING PREVIOUS WEEK DATA ===');
    console.log('Full reportData:', this.reportData);
    console.log('Previous week exists:', !!this.reportData?.previousWeek);
    console.log('Previous week detailed_daily exists:', !!this.reportData?.previousWeek?.detailed_daily);
    console.log('Previous week detailed_daily length:', this.reportData?.previousWeek?.detailed_daily?.length);
    console.log('Previous week category data:', this.reportData?.previousWeek?.category);
    console.log('Previous week daily data:', this.reportData?.previousWeek?.daily);
    
    if (this.selectedCategory) {
      const categoryInPrevious = this.reportData?.previousWeek?.category?.find((c: CategoryTotal) => c.category === this.selectedCategory);
      console.log(`${this.selectedCategory} in previous week categories:`, categoryInPrevious);
    }
    
    if (this.reportData?.previousWeek?.detailed_daily) {
      const uniqueCategories = [...new Set(this.reportData.previousWeek.detailed_daily.map((d: DetailedDaily) => d.category))];
      console.log('All categories in previous week detailed_daily:', uniqueCategories);
      console.log('Sample previous week detailed_daily entries:', this.reportData.previousWeek.detailed_daily.slice(0, 5));
    }
    
    if (this.reportData?.detailed_daily) {
      const currentUniqueCategories = [...new Set(this.reportData.detailed_daily.map((d: DetailedDaily) => d.category))];
      console.log('All categories in current week detailed_daily:', currentUniqueCategories);
      console.log('Sample current week detailed_daily entries:', this.reportData.detailed_daily.slice(0, 5));
    }
  }

  /**
   * ✅ UPDATED METHOD: Get daily breakdown data with proper typing
   */
  getDailyBreakdownData(): any[] {
    if (!this.selectedCategory || !this.reportData) {
      console.log('No selected category or report data');
      return [];
    }

    console.log('🔍 Debug getDailyBreakdownData:');
    console.log('Selected Category:', this.selectedCategory);
    console.log('Current week detailed_daily:', this.reportData.detailed_daily);
    console.log('Previous week data:', this.reportData.previousWeek);
    console.log('Previous week detailed_daily:', this.reportData.previousWeek?.detailed_daily);

    const allDates = new Set<string>();
    
    // ✅ FIXED: Proper typing for lambda parameters
    if (this.reportData.detailed_daily) {
      const currentWeekFiltered = this.reportData.detailed_daily
        .filter((d: DetailedDaily) => d.category === this.selectedCategory);
      console.log('Current week filtered data:', currentWeekFiltered);
      currentWeekFiltered.forEach((d: DetailedDaily) => allDates.add(d.date));
    }
    
    if (this.reportData.previousWeek?.detailed_daily) {
      const previousWeekFiltered = this.reportData.previousWeek.detailed_daily
        .filter((d: DetailedDaily) => d.category === this.selectedCategory);
      console.log('Previous week filtered data:', previousWeekFiltered);
      previousWeekFiltered.forEach((d: DetailedDaily) => allDates.add(d.date));
    } else {
      console.warn('Previous week detailed_daily not available');
      
      if (this.reportData.previousWeek?.daily && this.reportData.previousWeek?.category) {
        const categoryTotal = this.reportData.previousWeek.category.find((c: CategoryTotal) => c.category === this.selectedCategory)?.amount ?? 0;
        const weekTotal = this.reportData.previousWeek.daily.reduce((sum: number, d: DailyTotal) => sum + d.total, 0);
        
        if (categoryTotal > 0 && weekTotal > 0) {
          console.log(`Previous week ${this.selectedCategory} total: ₹${categoryTotal}`);
          console.log('Previous week daily totals:', this.reportData.previousWeek.daily);
          this.reportData.previousWeek.daily.forEach((d: DailyTotal) => allDates.add(d.date));
        }
      }
    }

    console.log('All unique dates:', Array.from(allDates));

    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(date => {
      // ✅ FIXED: Proper typing for lambda parameters
      const currentAmount = this.reportData?.detailed_daily
        ?.filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory)
        ?.reduce((sum: number, d: DetailedDaily) => sum + (d.amount || 0), 0) ?? 0;
      
      let previousAmount = 0;
      
      if (this.reportData?.previousWeek?.detailed_daily) {
        previousAmount = this.reportData.previousWeek.detailed_daily
          .filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory)
          .reduce((sum: number, d: DetailedDaily) => sum + (d.amount || 0), 0);
      } else {
        const categoryTotal = this.reportData?.previousWeek?.category?.find((c: CategoryTotal) => c.category === this.selectedCategory)?.amount ?? 0;
        const dailyTotal = this.reportData?.previousWeek?.daily?.find((d: DailyTotal) => d.date === date)?.total ?? 0;
        const weekTotal = this.reportData?.previousWeek?.daily?.reduce((sum: number, d: DailyTotal) => sum + d.total, 0) ?? 0;
        
        if (categoryTotal > 0 && dailyTotal > 0 && weekTotal > 0) {
          previousAmount = (categoryTotal / weekTotal) * dailyTotal;
          console.log(`Estimated previous amount for ${date}: ₹${previousAmount.toFixed(2)} (from category total ₹${categoryTotal})`);
        }
      }
      
      console.log(`Date ${date}:`, {
        currentAmount,
        previousAmount,
        currentFiltered: this.reportData?.detailed_daily?.filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory),
        previousFiltered: this.reportData?.previousWeek?.detailed_daily?.filter((d: DetailedDaily) => d.date === date && d.category === this.selectedCategory)
      });
      
      const difference = currentAmount - previousAmount;
      const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'long' });
      
      return {
        date,
        dayName,
        currentAmount,
        previousAmount,
        difference
      };
    });
  }

  /**
   * ✅ Get totals for daily breakdown
   */
  getDailyBreakdownTotals(): any {
    const dailyData = this.getDailyBreakdownData();
    
    const currentTotal = dailyData.reduce((sum, day) => sum + day.currentAmount, 0);
    const previousTotal = dailyData.reduce((sum, day) => sum + day.previousAmount, 0);
    const totalDifference = currentTotal - previousTotal;
    
    console.log('Daily breakdown totals:', { currentTotal, previousTotal, totalDifference });
    
    return {
      currentTotal,
      previousTotal,
      totalDifference
    };
  }

  /** CHARTS **/
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
        data: categories.map((cat: CategoryTotal) => ({
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
    
    this.categoryChart.on('click', (params: any) => {
      console.log('📊 Chart click event fired:', params);
      if (params && params.name) {
        this.onCategoryClick(params.name);
      } else {
        console.warn('⚠️ No category name found in click params:', params);
      }
    });
    
    console.log('📊 Chart initialized with categories:', categories.map((c: CategoryTotal) => c.category));
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
      .filter((d: DetailedDaily) => d.category === this.selectedCategory)
      .forEach((d: DetailedDaily) => {
        const existing = dailyMap.get(d.date) || 0;
        dailyMap.set(d.date, existing + (d.amount || 0));
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
      formatter: (params: any) =>
        `${params[0].name}: ₹${params[0].value}`
    },
    xAxis: {
      type: 'category',
      data: dailySource.map((d: DailyTotal) =>
        new Date(d.date).toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      )
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '₹{value}' }
    },
    series: [{
      name: 'Daily Expense',
      type: 'bar',
      data: dailySource.map((d: DailyTotal) => d.total),
      itemStyle: { color: '#3B82F6' }
    }]
  });

  // 🔑 ensure rendering
  this.dailyChart.resize();
}


  private disposeCharts(): void {
    this.categoryChart?.dispose?.();
    this.categoryChart = null;
    this.dailyChart?.dispose?.();
    this.dailyChart = null;
  }

  // ✅ FIXED: Proper typing for parameters
  findCategoryAmount(arr: CategoryTotal[] | undefined, category: string): number {
    if (!arr) return 0;
    return arr.find((c: CategoryTotal) => c.category === category)?.amount ?? 0;
  }

  // ✅ FIXED: Proper typing for parameters
  getCategoryChange(current: CategoryTotal, prevList: CategoryTotal[]): number {
    const previous = prevList?.find((c: CategoryTotal) => c.category === current.category)?.amount ?? 0;
    if (previous === 0) return current.amount === 0 ? 0 : 100;
    return ((current.amount - previous) / Math.abs(previous)) * 100;
  }

  // ✅ FIXED: Proper null checks and type safety - This fixes line 480 error
  get expenseComparison(): number | undefined {
    if (!this.reportData?.previousWeek) return undefined;
    
    const current = this.selectedCategory
      ? this.filteredCategories[0]?.amount ?? 0
      : this.reportData.totalExpense ?? 0;
    
    const previous = this.selectedCategory
      ? this.reportData.previousWeek.category?.find((c: CategoryTotal) => c.category === this.selectedCategory)?.amount ?? 0
      : this.reportData.previousWeek.totalExpense ?? 0;
    
    // ✅ FIXED: This resolves the "'previous' is possibly 'undefined'" errors
    if (previous === undefined || previous === null || previous === 0) {
      return current === 0 ? 0 : 100;
    }
    
    return ((current - previous) / previous) * 100;
  }
}
