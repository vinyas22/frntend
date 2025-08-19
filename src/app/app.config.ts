// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import * as echarts from 'echarts/core';
// ✅ Removed all ng-icons imports

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideRouter(routes),
    { provide: NGX_ECHARTS_CONFIG, useValue: { echarts } },
    provideAnimations(),
    importProvidersFrom(SharedModule)
    // ✅ Removed NgIconsModule.withIcons() completely
  ]
};
