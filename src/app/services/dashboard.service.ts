import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /** 📊 Get dashboard stats */
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  /** 📈 Get category breakdown */
  getCategoryBreakdown(period: string = 'month'): Observable<any> {
    return this.http.get(`${this.apiUrl}/category-breakdown?period=${period}`);
  }

  /** 📋 Get recent transactions */
  getRecentTransactions(limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/recent-transactions?limit=${limit}`);
  }

  /** 🟢 Get available quarters */
  getAvailableQuarters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available-quarters`);
  }

  /** 🟢 Get quarterly report by quarter */
  getQuarterlyReport(quarter: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/quarterly-report?quarter=${quarter}`);
  }

  // Optional convenience methods for periods if you want
  getWeeklyBreakdown(): Observable<any> {
    return this.getCategoryBreakdown('week');
  }

  getMonthlyBreakdown(): Observable<any> {
    return this.getCategoryBreakdown('month');
  }

  getQuarterlyBreakdown(): Observable<any> {
    return this.getCategoryBreakdown('quarter');
  }

  getYearlyBreakdown(): Observable<any> {
    return this.getCategoryBreakdown('year');
  }
}
