import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.setDarkMode(true);
    } else if (savedTheme === 'light') {
      this.setDarkMode(false);
    } else {
      // Use system preference when no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }
  }

  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeSubject.value);
  }

  getDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
