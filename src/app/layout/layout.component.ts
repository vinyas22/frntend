import { Component, HostListener } from '@angular/core';
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
    SharedModule, // Must include NotificationBell if that's where it lives
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    NotificationBellComponent // Remove this if handled in SharedModule
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  isSidebarCollapsed = false;

  // Responsive sidebar/mobile
  isMobile = window.innerWidth <= 900;
  showMobileSidebar = false;
  
  // Toggle sidebar collapsed state (desktop)
  onSidebarCollapse(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  // Optionally triggered by hover (if you use this)
  onSidebarHover(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  // Toggle sidebar (open/hide for both mobile and desktop)
  toggleSidebar() {
    if (this.isMobile) {
      this.showMobileSidebar = !this.showMobileSidebar;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  // Mobile overlay/click closes sidebar
  closeMobileSidebar() {
    this.showMobileSidebar = false;
  }

  // Optional: open explicitly on mobile (ex: hamburger)
  openMobileSidebar() {
    this.showMobileSidebar = true;
  }

  // Responsive check: update isMobile on resize
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) {
      this.showMobileSidebar = false;
    }
  }

  // Demo theme toggle
  toggleDarkMode() {
    document.body.classList.toggle('dark');
  }

  // Dummy logout (replace with your auth service logic)
  logout() {
    // Do actual logout here
    // e.g. this.authService.logout();
    // this.router.navigate(['/login']);
    console.log('Logging out');
  }
}
