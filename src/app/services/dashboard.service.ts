import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
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
/** 🟢 Get Weekly Category Breakdown */
getWeeklyBreakdown(): Observable<any> {
  return this.getCategoryBreakdown('week');
}

/** 🔵 Get Monthly Category Breakdown */
getMonthlyBreakdown(): Observable<any> {
  return this.getCategoryBreakdown('month');
}

/** 🟠 Get Quarterly Category Breakdown */
getQuarterlyBreakdown(): Observable<any> {
  return this.getCategoryBreakdown('quarter');
}

/** 🟣 Get Yearly Category Breakdown */
getYearlyBreakdown(): Observable<any> {
  return this.getCategoryBreakdown('year');
}

/** 📑 Get Quarterly Report by year & quarter */
/** 🟢 Get available quarters */
getAvailableQuarters(): Observable<any> {
  return this.http.get(`${this.apiUrl}/available-quarters`);
}

/** 🟢 Get quarterly report by quarter */
getQuarterlyReport(quarter: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/quarterly-report?quarter=${quarter}`);
}

/** 📑 Get Yearly Report */
  
}
