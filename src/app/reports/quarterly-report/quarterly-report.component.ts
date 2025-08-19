import { Component, OnInit, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { ReportService } from '../../services/report.service';
import { QuarterPeriod, ReportData, CategoryTotal, DailyTotal, DetailedDaily } from '../../reports/models/report.interface';

@Component({
  selector: 'app-quarterly-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  providers: [
    { provide: NGX_ECHARTS_CONFIG, useValue: { echarts } }
  ],
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
  showDebugInfo = false;

  fullReportData: ReportData | null = null;
  displayReportData: ReportData | null = null;
  selectedCategoryFilter: string | null = null;

  // ✅ ALL REQUIRED CHART OPTIONS
  pieChartOptions: EChartsOption = {};
  monthlyTrendOptions: EChartsOption = {};
  dailyChartOptions: EChartsOption = {};
  quarterComparisonOptions: EChartsOption = {};

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 QuarterlyReportComponent initialized');
    await this.loadAvailableQuarters();
    if (this.quarterOptions.length > 0 && !this.selectedQuarter) {
      this.selectedQuarter = this.quarterOptions[0].value;
      console.log('🎯 Auto-selected first quarter:', this.selectedQuarter);
    }
    if (this.selectedQuarter) {
      this.loadReport();
    }
  }

  async loadAvailableQuarters(): Promise<void> {
    this.isLoadingQuarters = true;
    this.errorMessage = null;
    console.log('📅 Loading available quarters...');
    
    try {
      const quarters = await this.reportService.getAvailableQuarters().toPromise();
      this.quarterOptions = quarters ?? [];
      console.log('📅 Available quarters loaded:', this.quarterOptions);
      
      if (this.quarterOptions.length === 0) {
        this.errorMessage = 'No expense data found. Please add some expenses to generate quarterly reports.';
      }
    } catch (error: any) {
      console.error('❌ Failed to load quarters:', error);
      this.errorMessage = 'Failed to load available quarters. Please try again.';
      this.quarterOptions = this.generateFallbackQuarters();
    } finally {
      this.isLoadingQuarters = false;
      this.cdr.markForCheck();
    }
  }

  private generateFallbackQuarters(): QuarterPeriod[] {
    console.log('🔄 Generating fallback quarters');
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
    
    console.log('🎯 Loading report for quarter:', this.selectedQuarter);
    console.log('🎯 Selected quarter details:', this.quarterOptions.find(q => q.value === this.selectedQuarter));
    
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedCategoryFilter = null;
    
    try {
      const report = await this.reportService.getQuarterlyReport(this.selectedQuarter).toPromise();
      console.log('📊 Received report data:', report);
      console.log('📊 Previous quarter data:', report?.previousQuarter);
      
      this.fullReportData = report ?? null;
      this.applyFilter();
    } catch (error: any) {
      console.error('❌ Report loading error:', error);
      this.errorMessage = error.error?.message || 'Failed to load quarterly report.';
      this.fullReportData = null;
      this.displayReportData = null;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onQuarterChange(): void {
    console.log('🔄 Quarter changed to:', this.selectedQuarter);
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

  // ===== HELPER METHODS FOR SAFE ACCESS =====
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

  /**
   * Get previous quarter amount for a category
   */
  getPreviousAmount(category: string): number {
    if (!this.fullReportData?.previousQuarter?.category) return 0;
    const found = this.fullReportData.previousQuarter.category.find((c: CategoryTotal) => 
      (c.category || 'Uncategorized') === category
    );
    return found?.amount ?? 0;
  }

  /**
   * Get change amount between current and previous quarter for a category
   */
  getChangeAmount(category: string): number {
    const current = this.fullReportData?.category?.find((c: CategoryTotal) => 
      (c.category || 'Uncategorized') === category
    )?.amount ?? 0;
    const previous = this.getPreviousAmount(category);
    return current - previous;
  }

  /**
   * Get total amount for selected category in current quarter
   */
  getCategoryTotalForQuarter(): number {
    if (!this.selectedCategoryFilter || !this.fullReportData?.category) return 0;
    const found = this.fullReportData.category.find((c: CategoryTotal) => 
      (c.category || 'Uncategorized') === this.selectedCategoryFilter
    );
    return found?.amount ?? 0;
  }

  /**
   * Get monthly breakdown for quarter (3 months)
   */
  getMonthlyBreakdownData(): any[] {
    if (!this.fullReportData?.quarter) return [];
    
    const quarterMonths = this.fullReportData.quarter.months || ['Jan', 'Feb', 'Mar'];
    const year = this.fullReportData.quarter.year;
    const startMonth = (this.fullReportData.quarter.quarter - 1) * 3 + 1;
    
    return quarterMonths.map((monthName, index) => {
      const monthNumber = startMonth + index;
      const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;
      
      const currentAmount = this.selectedCategoryFilter ? 
        this.getCategoryAmountForMonth(monthKey, this.selectedCategoryFilter) : 
        this.getMonthTotalFromDaily(monthNumber);
      
      const prevYear = monthNumber <= 3 ? year - 1 : year;
      const prevMonth = monthNumber <= 3 ? monthNumber + 9 : monthNumber - 3;
      const previousAmount = this.selectedCategoryFilter ? 
        this.getPreviousCategoryAmountForMonth(prevMonth, this.selectedCategoryFilter) : 
        0;
      
      return {
        monthName,
        monthNumber,
        currentAmount,
        previousAmount,
        difference: currentAmount - previousAmount
      };
    });
  }

  /**
   * Get daily breakdown data for current quarter (excluding 0s)
   */
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

  /**
   * Get detailed daily data for selected category (excluding 0s)
   */
  getDetailedDailyData(): any[] {
    if (!this.selectedCategoryFilter) return [];
    return this.getDailyBreakdownData();
  }

  /**
   * ✅ ADDED MISSING METHOD - Get detailed monthly data for selected category (excluding 0s)
   */
  getDetailedMonthlyData(): any[] {
    if (!this.selectedCategoryFilter) return [];
    
    return this.getMonthlyBreakdownData().filter(month => 
      month.currentAmount > 0 || month.previousAmount > 0
    );
  }

  // ===== PRIVATE HELPER METHODS =====
  private getCategoryAmountForMonth(monthKey: string, category: string): number {
    if (!this.fullReportData?.detailed_daily) return 0;
    
    return this.fullReportData.detailed_daily
      .filter((d: DetailedDaily) => d.date.startsWith(monthKey) && (d.category || 'Uncategorized') === category)
      .reduce((sum: number, d: DetailedDaily) => sum + (d.amount || 0), 0);
  }

  private getCategoryAmountForDate(date: string, category: string): number {
    if (!this.fullReportData?.detailed_daily) return 0;
    
    return this.fullReportData.detailed_daily
      .filter((d: DetailedDaily) => d.date === date && (d.category || 'Uncategorized') === category)
      .reduce((sum: number, d: DetailedDaily) => sum + (d.amount || 0), 0);
  }

  private getMonthTotalFromDaily(monthNumber: number): number {
    if (!this.fullReportData?.daily) return 0;
    
    const year = this.fullReportData.quarter?.year || new Date().getFullYear();
    const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;
    
    return this.fullReportData.daily
      .filter((d: DailyTotal) => d.date.startsWith(monthKey))
      .reduce((sum: number, d: DailyTotal) => sum + (d.total || 0), 0);
  }

  private getPreviousQuarterDayAmount(date: string): number {
    if (!this.fullReportData?.previousQuarter?.daily) return 0;
    
    const currentDate = new Date(date);
    const prevDate = new Date(currentDate);
    prevDate.setMonth(currentDate.getMonth() - 3);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const found = this.fullReportData.previousQuarter.daily.find((d: DailyTotal) => d.date === prevDateStr);
    return found?.total ?? 0;
  }

  private getPreviousCategoryAmountForMonth(monthNumber: number, category: string): number {
    if (!this.fullReportData?.previousQuarter?.detailed_daily) return 0;
    
    const prevYear = this.fullReportData.quarter?.year || new Date().getFullYear();
    const monthKey = `${prevYear}-${String(monthNumber).padStart(2, '0')}`;
    
    return this.fullReportData.previousQuarter.detailed_daily
      .filter((d: DetailedDaily) => d.date.startsWith(monthKey) && (d.category || 'Uncategorized') === category)
      .reduce((sum: number, d: DetailedDaily) => sum + (d.amount || 0), 0);
  }

  public applyFilter(): void {
    if (!this.fullReportData) return;
    
    console.log('🔄 Applying filter:', this.selectedCategoryFilter);
    this.isFilterLoading = true;
    let expense = this.fullReportData.totalExpense ?? 0;

    if (this.selectedCategoryFilter) {
      const cat = (this.fullReportData.category || []).find(
        (c: CategoryTotal) => (c.category || 'Uncategorized') === this.selectedCategoryFilter
      );
      expense = cat?.amount ?? 0;
    }

    this.displayReportData = {
      ...this.fullReportData,
      totalExpense: expense
    };

    this.updateCharts();
    this.isFilterLoading = false;
    this.cdr.detectChanges();
  }

  private updateCharts(): void {
    if (!this.fullReportData || !this.displayReportData) return;

    console.log('📊 Updating charts with filter:', this.selectedCategoryFilter);

    // ===== PIE CHART =====
    this.pieChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) =>
          `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')} (${p.percent}%)`
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { fontSize: 12 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: (this.fullReportData.category || []).map((c: CategoryTotal) => ({
          name: c.category || 'Uncategorized',
          value: Math.max(0, c.amount || 0),
          selected: (c.category || 'Uncategorized') === this.selectedCategoryFilter
        }))
      }] as any
    };

    // ===== MONTHLY TREND CHART =====
    const monthlyData = this.getMonthlyBreakdownData();
    this.monthlyTrendOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const arr = Array.isArray(params) ? params : [params];
          return arr.map((p: any) => 
            `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`
          ).join('<br>');
        }
      },
      legend: { data: ['Current Quarter', 'Previous Quarter'] },
      grid: { 
        top: '15%', 
        left: '10%', 
        right: '10%', 
        bottom: '15%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map(m => m.monthName)
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
        }
      },
      series: [
        {
          name: 'Current Quarter',
          type: 'line',
          data: monthlyData.map(m => m.currentAmount),
          itemStyle: { color: '#4f46e5' },
          smooth: true
        },
        ...(this.fullReportData.previousQuarter ? [{
          name: 'Previous Quarter',
          type: 'line',
          data: monthlyData.map(m => m.previousAmount),
          itemStyle: { color: '#9ca3af' },
          smooth: true
        }] : [])
      ] as any
    };

    // ===== DAILY CHART =====
    const dailyData = this.getDailyBreakdownData();
    this.dailyChartOptions = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}: ₹${(+p.value || 0).toLocaleString('en-IN')}`;
        }
      },
      grid: { 
        top: '10%', 
        left: '10%', 
        right: '10%', 
        bottom: '15%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: dailyData.map(d => formatDate(new Date(d.date), 'd MMM', this.locale))
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
        data: dailyData.map(d => d.currentAmount),
        itemStyle: { 
          color: '#4f46e5',
          borderRadius: [4, 4, 0, 0]
        }
      }] as any
    };

    // ===== QUARTER COMPARISON CHART =====
    if (this.fullReportData.previousQuarter) {
      const currentCategories = this.fullReportData.category || [];
      const previousCategories = this.fullReportData.previousQuarter.category || [];
      
      let topCategories: CategoryTotal[];
      
      if (this.selectedCategoryFilter) {
        const currentCat = currentCategories.find((c: CategoryTotal) => 
          (c.category || 'Uncategorized') === this.selectedCategoryFilter
        );
        topCategories = currentCat ? [currentCat] : [];
      } else {
        topCategories = currentCategories.slice(0, 5);
      }
      
      this.quarterComparisonOptions = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const arr = Array.isArray(params) ? params : [params];
            return arr.map((p: any) => 
              `${p.seriesName}: ₹${(+p.value || 0).toLocaleString('en-IN')}`
            ).join('<br>');
          }
        },
        legend: { data: ['Current Quarter', 'Previous Quarter'] },
        grid: { 
          top: '15%', 
          left: '10%', 
          right: '10%', 
          bottom: '25%', 
          containLabel: true 
        },
        xAxis: {
          type: 'category',
          data: topCategories.map((c: CategoryTotal) => c.category || 'Uncategorized'),
          axisLabel: { rotate: 45 }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) =>
              value >= 1000 ? `₹${(value / 1000).toFixed(0)}K` : `₹${value}`
          }
        },
        series: [
          {
            name: 'Current Quarter',
            type: 'bar',
            data: topCategories.map((c: CategoryTotal) => c.amount),
            itemStyle: { color: '#4f46e5' }
          },
          {
            name: 'Previous Quarter',
            type: 'bar',
            data: topCategories.map((c: CategoryTotal) => {
              const prevCat = previousCategories.find((pc: CategoryTotal) => 
                (pc.category || 'Uncategorized') === (c.category || 'Uncategorized')
              );
              return prevCat?.amount ?? 0;
            }),
            itemStyle: { color: '#9ca3af' }
          }
        ] as any
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

  getQuarterRange(): string {
    if (!this.fullReportData?.quarter) return '';
    const q: any = this.fullReportData.quarter;
    return q?.months && q.months.length === 3 ? `${q.months[0]} - ${q.months[2]} ${q.year}` : '';
  }

  getCategoryPercentage(categoryAmount: number): string {
    if (!this.fullReportData?.totalExpense || this.fullReportData.totalExpense === 0) return '0.0';
    return ((categoryAmount / this.fullReportData.totalExpense) * 100).toFixed(1);
  }
}
