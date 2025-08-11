import { Component, HostListener, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
// If you use NotificationBell as a standalone or in SharedModule, import accordingly:
import { NotificationBellComponent } from '../notifications/notification-bell/notification-bell.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  styleUrls: ['./layout.component.scss'],
  imports: [
    SharedModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    NotificationBellComponent
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;

  // Responsive sidebar/mobile
  isMobile = false; // set default; we’ll set proper value in ngOnInit
  showMobileSidebar = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 900;
    }
  }

  // Toggle sidebar collapsed state (desktop)
  onSidebarCollapse(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  onSidebarHover(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.showMobileSidebar = !this.showMobileSidebar;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeMobileSidebar() {
    this.showMobileSidebar = false;
  }

  openMobileSidebar() {
    this.showMobileSidebar = true;
  }

  // Responsive check: update isMobile on resize
  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 900;
      if (!this.isMobile) {
        this.showMobileSidebar = false;
      }
    }
  }

  toggleDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('dark');
    }
  }

  logout() {
    console.log('Logging out');
  }
}
