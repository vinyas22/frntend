import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  ReportData, 
  WeekPeriod, 
  MonthPeriod, 
  QuarterPeriod, 
  YearPeriod 
} from '../reports/models/report.interface';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== QUARTERLY REPORTS (FIXED) =====
  getAvailableQuarters(): Observable<QuarterPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/quarters/available`)
      .pipe(
        map(response => {
          console.log('🔍 Quarters API Response:', response);
          return response.data?.quarters || response.quarters || response || [];
        }),
        catchError(this.handleError),
        map(data => { 
          this.setLoading(false); 
          return data; 
        })
      );
  }

  getQuarterlyReport(quarterValue: string): Observable<ReportData> {
    this.setLoading(true);
    console.log('📅 Requesting quarterly report for:', quarterValue);
    
    const params = new HttpParams().set('date', quarterValue);
    
    return this.http.get<any>(`${this.apiUrl}/quarterly`, { params })
      .pipe(
        map(response => {
          console.log('📊 Quarterly API Response:', response);
          return response.data || response;
        }),
        catchError(this.handleError),
        map(data => { 
          this.setLoading(false); 
          return data; 
        })
      );
  }

  // ===== WEEKLY REPORTS =====
  getAvailableWeeks(): Observable<WeekPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/weekly/available-periods`)
      .pipe(
        map(response => response.data?.periods || response.periods || []),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

 

  // ===== MONTHLY REPORTS =====
  getAvailableMonths(): Observable<MonthPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/monthly/available-months`)
      .pipe(
        map(response => response.data?.periods || response.periods || []),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  getMonthlyReport(monthValue: string): Observable<ReportData> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/monthly/data/${monthValue}`)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  // ===== YEARLY REPORTS =====
// ===== YEARLY REPORTS (FIXED) =====
getAvailableYears(): Observable<YearPeriod[]> {
  this.setLoading(true);
  return this.http.get<any>(`${this.apiUrl}/years/available`)
    .pipe(
      map(response => response.data?.years || response.years || []),
      catchError(this.handleError),
      map(data => { this.setLoading(false); return data; })
    );
}
getWeeklyReport(weekValue: string): Observable<ReportData> {
  this.setLoading(true);
  return this.http.get<any>(`${this.apiUrl}/weekly/data/${weekValue}`).pipe(
    map(response => {
      const data: ReportData = response.data || response || {};
      return {
        ...data,
        totalExpense: data.totalExpense ?? 0,
        totalIncome: data.totalIncome ?? 0,
        savings: data.savings ?? 0,
        savingsRate: data.savingsRate ?? 0,
        daily: data.daily ?? [],
        category: data.category ?? [],
        previousWeek: data.previousWeek ?? {}
      };
    }),
    catchError(this.handleError),
    map(data => {
      this.setLoading(false);
      return data;
    })
  );
}

getYearlyReport(yearValue: string): Observable<ReportData> {
  this.setLoading(true);
  const params = new HttpParams().set('date', yearValue);

  return this.http.get<any>(`${this.apiUrl}/yearly`, { params }).pipe(
    map(response => {
      const data: ReportData = response.data || response || {};
      return {
        ...data,
        totalExpense: data.totalExpense ?? 0,
        totalIncome: data.totalIncome ?? 0,
        savings: data.savings ?? 0,
        savingsRate: data.savingsRate ?? 0,
        monthly: data.monthly ?? [],
        category: data.category ?? [],
        previousYear: data.previousYear ?? {}
      };
    }),
    catchError(this.handleError),
    map(data => {
      this.setLoading(false);
      return data;
    })
  );
}


  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError = (error: any): Observable<never> => {
    this.setLoading(false);
    console.error('❌ Report service error:', error);
    throw error;
  }
}
