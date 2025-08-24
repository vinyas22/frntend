import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkModeSubject.asObservable();

  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
  }
  getDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
