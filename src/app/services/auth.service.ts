import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Forgot/reset password flow state
  private passwordResetIdentifier: string = '';
  private passwordResetToken: string = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ---- Auth methods ----
  login(data: { identifier: string; password: string }) {
    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.token) this.setToken(response.token);
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, email, password });
  }

  refreshToken(oldToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh-token`, { oldToken });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
  }

  // ---- Email verification ----
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify?token=${encodeURIComponent(token)}`);
  }

  resendVerification(data: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, data);
  }

  // ---- Forgot password/OTP flows ----
  requestPasswordOtp(data: { identifier: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-otp`, data);
  }

  verifyResetOtp(data: { identifier: string; otp: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-reset-otp`, data);
  }

  resetPassword(data: { identifier: string; resetToken: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // ---- Password reset state methods ----
  setPasswordResetIdentifier(identifier: string) {
    this.passwordResetIdentifier = identifier;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('passwordResetIdentifier', identifier);
    }
  }

  getPasswordResetIdentifier(): string {
    if (this.passwordResetIdentifier) return this.passwordResetIdentifier;
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('passwordResetIdentifier') || '';
    }
    return '';
  }

  setPasswordResetToken(token: string) {
    this.passwordResetToken = token;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('passwordResetToken', token);
    }
  }

  getPasswordResetToken(): string {
    if (this.passwordResetToken) return this.passwordResetToken;
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('passwordResetToken') || '';
    }
    return '';
  }

  clearPasswordResetState() {
    this.passwordResetIdentifier = '';
    this.passwordResetToken = '';
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('passwordResetIdentifier');
      sessionStorage.removeItem('passwordResetToken');
    }
  }

  // ---- Login token management ----
  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  }

  isLoggedIn(): boolean {
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('token');
  }
}
