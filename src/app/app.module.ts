import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { appConfig } from './app.config';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    // other imports if needed
  ],
  providers: [
    { provide: 'APP_CONFIG', useValue: appConfig },
    provideRouter(routes)
  ],
  // no declarations or bootstrap for AppComponent here
})
export class AppModule {}
