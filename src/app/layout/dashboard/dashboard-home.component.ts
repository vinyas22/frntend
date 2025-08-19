import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { LayoutService } from '../layout.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
styleUrls : ['./dashboard-home.component.scss'],
  templateUrl:   './dashboard-home.component.html'
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  stats: any = {};
  transactions: any[] = [];
  categories: any[] = [];
  selectedPeriod: string = 'month';
  availableQuarters: { label: string, value: string }[] = [];
  selectedQuarter: string = '';
  quarterlyReport: any = {};
  isCollapsed = false;
  private sidebarSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTransactions();
    this.loadCategoryBreakdown();
    this.loadAvailableQuarters();
    this.sidebarSubscription = this.layoutService.sidebarCollapsed$.subscribe(
      collapsed => (this.isCollapsed = collapsed)
    );
  }
  ngOnDestroy() {
    this.sidebarSubscription?.unsubscribe();
  }
  loadStats() {
    this.dashboardService.getStats().subscribe({
      next: (res) => (this.stats = res),
      error: (err) => console.error('Error loading stats', err)
    });
  }
  loadTransactions() {
    this.dashboardService.getRecentTransactions(5).subscribe({
      next: (res) => (this.transactions = res.transactions),
      error: (err) => console.error('Error loading transactions', err)
    });
  }
  loadCategoryBreakdown() {
    this.dashboardService.getCategoryBreakdown(this.selectedPeriod).subscribe({
      next: (res) => (this.categories = res.categories),
      error: (err) => console.error('Error loading category breakdown', err)
    });
  }
  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.loadCategoryBreakdown();
  }
  loadAvailableQuarters() {
    this.dashboardService.getAvailableQuarters().subscribe({
      next: (res) => {
        this.availableQuarters = res.quarters;
        if (this.availableQuarters.length > 0) {
          this.selectedQuarter = this.availableQuarters[0].value;
          this.loadQuarterlyReport();
        }
      },
      error: (err) => console.error('Error loading available quarters', err)
    });
  }
  loadQuarterlyReport() {
    if (!this.selectedQuarter) return;
    this.dashboardService.getQuarterlyReport(this.selectedQuarter).subscribe({
      next: (res) => (this.quarterlyReport = res),
      error: (err) => console.error('Error loading quarterly report', err)
    });
  }
}
