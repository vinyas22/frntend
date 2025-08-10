import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.initializeSocket();
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(n => this.notifications = n)
    );
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count)
    );
    this.subscriptions.push(
      this.notificationService.connectionStatus$.subscribe(status => this.isConnected = status)
    );
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationService.disconnectSocket();
  }

  loadNotifications(): void { 
    this.notificationService.loadNotifications().subscribe(); 
  }

  toggleNotifications(): void { this.isOpen = !this.isOpen; }
  closeNotifications(): void { this.isOpen = false; }
  markAllAsRead(): void { this.notificationService.markAllAsRead().subscribe(); }

  handleNotificationClick(notification: Notification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    this.closeNotifications();
    this.notificationService.navigateToReport(notification);
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString();
  }

  formatAmount(amount: number): string {
    if (amount >= 100000) { return `${(amount / 100000).toFixed(1)}L`; }
    if (amount >= 1000)    { return `${(amount / 1000).toFixed(1)}K`; }
    return amount.toLocaleString('en-IN');
  }
}
