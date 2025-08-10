import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

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
  resizeListener = () => this.checkScreen();

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Subscribe to sidebar collapse state from LayoutService
    this.layoutService.sidebarCollapsed$.subscribe(val => this.isCollapsed = val);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreen();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  checkScreen() {
    if (isPlatformBrowser(this.platformId)) {
      // Use a breakpoint; <768px counts as mobile for sidebar
      this.isMobile = window.innerWidth < 768;
      if (!this.isMobile) this.showMobileSidebar = false;
    }
  }

  // Mobile sidebar controls
  openMobileSidebar() {
    this.showMobileSidebar = true;
  }
  closeMobileSidebar() {
    this.showMobileSidebar = false;
  }

  // Sidebar navigation handlers, close sidebar for mobile after navigation
  openAddEntry() {
    this.entriesDropdown = false;
    this.router.navigate(['/dashboard/entries-add']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openCreateMonthlySalary() {
    this.billsDropdown = false;
    this.router.navigate(['/dashboard/bills/add']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openUpdateBalance() {
    this.billsDropdown = false;
    this.router.navigate(['/dashboard/bills/update-balance']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openWeeklyReport() {
    this.reportsDropdown = false;
    this.router.navigate(['/reports/weekly']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openMonthlyReport() {
    this.reportsDropdown = false;
    this.router.navigate(['/reports/monthly']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openQuarterlyReport() {
    this.reportsDropdown = false;
    this.router.navigate(['/reports/quarterly']);
    if (this.isMobile) this.closeMobileSidebar();
  }
  openYearlyReport() {
    this.reportsDropdown = false;
    this.router.navigate(['/reports/yearly']);
    if (this.isMobile) this.closeMobileSidebar();
  }

  // Desktop hover behavior: expand/collapse on mouse enter/leave
  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.isMobile) this.layoutService.toggleSidebar(false); // expand
  }
  @HostListener('mouseleave')
  onMouseLeave() {
    if (!this.isMobile) this.layoutService.toggleSidebar(true); // collapse
  }
}
