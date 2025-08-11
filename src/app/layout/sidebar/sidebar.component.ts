import {
  Component, HostListener, OnDestroy, OnInit, Inject, PLATFORM_ID
} from '@angular/core';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  entriesDropdown = false;
  billsDropdown = false;
  reportsDropdown = false;
  isMobile = false;
  showMobileSidebar = false;
  private destroy$ = new Subject<void>();
  resizeListener = () => this.checkScreen();

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.layoutService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.isCollapsed = val);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreen();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  checkScreen() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      if (!this.isMobile) this.showMobileSidebar = false;
    }
  }

  openMobileSidebar() { this.showMobileSidebar = true; }
  closeMobileSidebar() { this.showMobileSidebar = false; }

  openAddEntry() { this.entriesDropdown = false; this.router.navigate(['/dashboard/entries-add']); if (this.isMobile) this.closeMobileSidebar(); }
  openCreateMonthlySalary() { this.billsDropdown = false; this.router.navigate(['/dashboard/bills/add']); if (this.isMobile) this.closeMobileSidebar(); }
  openUpdateBalance() { this.billsDropdown = false; this.router.navigate(['/dashboard/bills/update-balance']); if (this.isMobile) this.closeMobileSidebar(); }
  openWeeklyReport() { this.reportsDropdown = false; this.router.navigate(['/reports/weekly']); if (this.isMobile) this.closeMobileSidebar(); }
  openMonthlyReport() { this.reportsDropdown = false; this.router.navigate(['/reports/monthly']); if (this.isMobile) this.closeMobileSidebar(); }
  openQuarterlyReport() { this.reportsDropdown = false; this.router.navigate(['/reports/quarterly']); if (this.isMobile) this.closeMobileSidebar(); }
  openYearlyReport() { this.reportsDropdown = false; this.router.navigate(['/reports/yearly']); if (this.isMobile) this.closeMobileSidebar(); }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (isPlatformBrowser(this.platformId) && !this.isMobile) {
      this.layoutService.toggleSidebar(false);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (isPlatformBrowser(this.platformId) && !this.isMobile) {
      this.layoutService.toggleSidebar(true);
    }
  }
}
