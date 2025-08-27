import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { LayoutService } from './layout/layout.service';
import { Notification, NotificationService } from './services/notification.service';
import { Subscription, filter } from 'rxjs';

import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { SharedModule } from './shared/shared.module';
import { NotificationToastComponent } from './notifications/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    SidebarComponent,
    HeaderComponent,
    SharedModule,
    RouterOutlet,    // needed for router-outlet in standalone
    NotificationToastComponent
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  isLoginLayout = false;
  isSidebarCollapsed = false;
  latestToast: Notification | null = null;
  private toastSub!: Subscription;
  private routerSub!: Subscription;

  layoutService = inject(LayoutService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  // PWA Install Prompt event saved here
  deferredPrompt: any = null;
  // Controls visibility of install button
  showInstallButton = false;

  // Listen to the beforeinstallprompt event on window and save it
  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();  // Prevent default prompt
    this.deferredPrompt = event;
    this.showInstallButton = true;  // Show install button in UI
  }

  ngOnInit() {
    // Toast notification subscription
    this.toastSub = this.notificationService.toast$.subscribe(toast => {
      this.latestToast = toast;
    });

    // Update layout type on route change
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url.split('?')[0];
        // Handles all auth/login pages
        this.isLoginLayout = [
          '/login', '/register', '/forgot-password',
          '/verify-otp', '/reset-password',
          '/verify', '/resend-verification'
        ].includes(url);
      });

    // Sidebar collapse state
    this.layoutService.sidebarCollapsed$.subscribe(val => {
      this.isSidebarCollapsed = val;
    });
  }

  // Call this method from your UI button to prompt installation
  installPWA() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallButton = false;
    });
  }

  ngOnDestroy() {
    this.toastSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }
}
