// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import { NgIconsModule } from '@ng-icons/core';
import { HeroHome, HeroUser, HeroDocumentText, HeroChartPie, HeroBell } from '@ng-icons/heroicons/outline';
import { AuthInterceptor } from './shared/auth.interceptor';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import * as echarts from 'echarts/core';
export const appConfig: ApplicationConfig = {
  providers: [
    // HttpClient with interceptors and fetch API
    provideHttpClient(withInterceptorsFromDi(), withFetch()),

    // Add routing
    provideRouter(routes),
{
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts },
    },
    // Animations support
    provideAnimations(),

    // Import shared & icons module
    importProvidersFrom(
      SharedModule,
      NgIconsModule.withIcons({ HeroHome, HeroUser, HeroBell, HeroDocumentText, HeroChartPie })
    ),

    // Global Auth interceptor
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
