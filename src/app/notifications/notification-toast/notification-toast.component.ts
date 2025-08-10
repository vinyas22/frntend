import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss']
})
export class NotificationToastComponent implements OnInit {
  @Input() notification!: Notification;
  @Output() closed = new EventEmitter<void>();
  @Output() clicked = new EventEmitter<Notification>();

  isVisible = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Mount with transition
    setTimeout(() => this.isVisible = true, 100);
    // Auto-close after 5s (customize)
    setTimeout(() => this.close(), 5000);
  }

  close(): void {
    this.isVisible = false;
    setTimeout(() => this.closed.emit(), 350); // match transition duration
  }

  handleClick(): void {
    this.clicked.emit(this.notification);
    // Optionally, only navigate for report notifications
    this.notificationService.navigateToReport(this.notification);
    this.close();
  }

  getNotificationIcon(): string {
    switch (this.notification.type) {
      case 'success': return '✅';
      case 'error':   return '❌';
      case 'warning': return '⚠️';
      case 'info':    return 'ℹ️';
      default:        return this.notificationService.getNotificationIcon(this.notification.type);
    }
  }
}
