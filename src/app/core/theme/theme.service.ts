import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  // Theme state
  public readonly currentTheme = signal<Theme>('system');
  public readonly isDarkMode = signal<boolean>(false);

  private readonly THEME_KEY = 'karateflow-theme';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();

      // Listen to system preference changes
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', () => {
            if (this.currentTheme() === 'system') {
              this.applyTheme('system');
            }
          });
        }
      }
      
      // Effect to sync state to DOM
      effect(() => {
        const isDark = this.isDarkMode();
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
    }
  }

  private initTheme(): void {
    try {
      const savedTheme = typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem(this.THEME_KEY) as Theme 
        : null;
        
      if (savedTheme) {
        this.currentTheme.set(savedTheme);
        this.applyTheme(savedTheme);
      } else {
        this.currentTheme.set('system');
        this.applyTheme('system');
      }
    } catch {
      this.currentTheme.set('system');
      this.applyTheme('system');
    }
  }

  public setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.THEME_KEY, theme);
        }
      } catch {
        // Ignore error during tests
      }
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'system') {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia 
        ? window.matchMedia('(prefers-color-scheme: dark)').matches 
        : false;
      this.isDarkMode.set(prefersDark);
    } else {
      this.isDarkMode.set(theme === 'dark');
    }
  }
}
