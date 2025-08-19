import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('🔧 AuthInterceptor instantiated');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🚀 AuthInterceptor.intercept() called for:', req.url);
    
    let token: string | null = null;
    
    if (isPlatformBrowser(this.platformId)) {
      token = this.auth.getToken();
      console.log('🔑 Token retrieved:', token ? 'Present' : 'Missing');
    }

    if (token) {
      req = req.clone({ 
        setHeaders: { 
          Authorization: `Bearer ${token}` 
        } 
      });
      console.log('✅ Authorization header added to request');
    } else {
      console.log('❌ No token - request sent without Authorization header');
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.warn('🚨 401 Unauthorized - clearing token and redirecting');
          if (isPlatformBrowser(this.platformId)) {
            this.auth.logout();
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
