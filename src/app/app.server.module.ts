import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { bootstrapApplication } from '@angular/platform-browser';

@NgModule({
  imports: [
    ServerModule
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}

// Optional: allow SSR to bootstrap standalone AppComponent with appConfig
export function bootstrap() {
  return bootstrapApplication(AppComponent, appConfig);
}
