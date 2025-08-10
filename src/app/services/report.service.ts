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

  // Weekly Reports
  getAvailableWeeks(): Observable<WeekPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/weekly/available-periods`)
      .pipe(
        map(response => response.data.periods),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  getWeeklyReport(weekValue: string): Observable<ReportData> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/weekly/data/${weekValue}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  // Monthly Reports
  getAvailableMonths(): Observable<MonthPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/monthly/available-months`)
      .pipe(
        map(response => response.data.periods),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  getMonthlyReport(monthValue: string): Observable<ReportData> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/monthly/data/${monthValue}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  // Quarterly Reports


  // Yearly Reports
  getAvailableYears(): Observable<YearPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/years/available`)
      .pipe(
        map(response => response.data.years),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  getYearlyReport(yearValue: string): Observable<ReportData> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/yearly/data/${yearValue}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

 

  
  // Quarterly Reports
   getAvailableQuarters(): Observable<QuarterPeriod[]> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/quarters/available`)
      .pipe(
        map(response => response.data.quarters),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }
 getQuarterlyReport(quarterValue: string): Observable<ReportData> {
    this.setLoading(true);
    return this.http.get<any>(`${this.apiUrl}/quarterly/data/${quarterValue}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => { this.setLoading(false); return data; })
      );
  }

  // Weekly/Monthly/Yearly omitted here for brevity, but keep them as in your last code

   private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
  private handleError = (error: any): Observable<never> => {
    this.setLoading(false);
    console.error('Report service error:', error);
    throw error;
  }
}
