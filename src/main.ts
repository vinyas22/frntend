import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';
import { inject } from '@angular/core';

// Direct interceptor function
function authInterceptorFn(req: any, next: any) {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  console.log('🔧 Direct interceptor running for:', req.url, 'Token:', token ? 'Present' : 'Missing');
  
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    console.log('✅ Authorization header added');
  }
  
  return next(req);
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptorFn])),
    provideRouter(routes),
    // ... other providers
  ]
});
