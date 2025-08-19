// src/app/services/notification.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// --- Types ---
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = environment.apiUrl;
  private socket: any = null;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  // --- Toast pop-up channel ---
  private toastSubject = new Subject<Notification>();
  public toast$ = this.toastSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // --- Real-time Socket.IO communication ---
  initializeSocket(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) return;

    import('socket.io-client').then(({ io }) => {
      if (this.socket) this.socket.disconnect();

      this.socket = io(environment.socketUrl || environment.apiUrl.replace('/api', ''), {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => this.connectionStatusSubject.next(true));
      this.socket.on('disconnect', () => this.connectionStatusSubject.next(false));

      this.socket.on('new_notification', (notif: Notification) => {
        this.notificationsSubject.next([notif, ...this.notificationsSubject.value]);
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      });

      this.socket.on('notification_marked_read', (data: { notificationId: number }) => {
        const updated = this.notificationsSubject.value.map(n =>
          n.id === data.notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        this.notificationsSubject.next(updated);
      });

      this.socket.on('connect_error', () => this.connectionStatusSubject.next(false));
      this.socket.on('error', (error: any) => console.error('Socket error:', error));
    });
  }

  disconnectSocket(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectionStatusSubject.next(false);
  }

  // --- REST endpoints ---
  loadNotifications(page = 1, limit = 20): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(
      `${this.apiUrl}/notifications?page=${page}&limit=${limit}`
    ).pipe(
      tap(response => {
        if (page === 1) {
          this.notificationsSubject.next(response.notifications);
          this.unreadCountSubject.next(response.unreadCount);
        }
      }),
      catchError(error => { 
        console.error('Error loading notifications:', error); 
        return throwError(() => error); 
      })
    );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/notifications/${notificationId}/read`, {}
    ).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
      }),
      catchError(error => { 
        console.error('Error marking notification as read:', error); 
        return throwError(() => error); 
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/notifications/mark-all-read`, {}
    ).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n, is_read: true, read_at: new Date().toISOString()
        }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      }),
      catchError(error => { 
        console.error('Error marking all as read:', error); 
        return throwError(() => error); 
      })
    );
  }

  // --- Toast helpers ---
  showSuccess(message: string, title = 'Success') { this.emitToast('success', title, message); }
  showError(message: string, title = 'Error') { this.emitToast('error', title, message); }
  showInfo(message: string, title = 'Info') { this.emitToast('info', title, message); }
  showWarning(message: string, title = 'Warning') { this.emitToast('warning', title, message); }

  private emitToast(type: string, title: string, message: string) {
    const toast: Notification = {
      id: Date.now(),
      user_id: 0,
      type,
      title,
      message,
      data: {},
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.toastSubject.next(toast);
  }

  // --- Navigation helper ---
  navigateToReport(notification: Notification): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const reportType = notification.type.replace('_report_ready', '');
    let route: string[] = [];
    const queryParams: any = { notificationId: notification.id, ...notification.data };

    switch (reportType) {
      case 'weekly': route = ['/reports/weekly']; break;
      case 'monthly': route = ['/reports/monthly']; break;
      case 'quarterly': route = ['/reports/quarterly']; break;
      case 'yearly': route = ['/reports/yearly']; break;
      default: route = ['/dashboard'];
    }

    this.router.navigate(route, { queryParams });
  }

  getNotificationIcon(type: string): string {
    const icons = {
      success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️',
      weekly_report_ready: '📅', monthly_report_ready: '📊',
      quarterly_report_ready: '📈', yearly_report_ready: '🗓️', general: '📋'
    };
    return icons[type as keyof typeof icons] || icons.general;
  }
}
