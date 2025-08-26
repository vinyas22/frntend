import { Component } from '@angular/core';
import { LayoutService } from '../layout.service';
import { NotificationBellComponent } from '../../notifications/notification-bell/notification-bell.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/ThemeService';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [NotificationBellComponent]
})
export class HeaderComponent {
  darkMode = false;
  isCollapsed = false;

  constructor(
    private layoutService: LayoutService,
    private authService: AuthService,
    private router: Router, private themeService: ThemeService
  ) {
    this.layoutService.sidebarCollapsed$.subscribe(val => {
      this.isCollapsed = val;
    });
  }

toggleDarkMode() {
  this.darkMode = !this.darkMode;

    this.themeService.setDarkMode(this.darkMode);

}



  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
