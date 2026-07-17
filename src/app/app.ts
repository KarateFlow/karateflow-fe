import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from './shared/ui/breadcrumbs/breadcrumbs.component';
import { ThemeService } from './core/theme/theme.service';
import { ToastContainerComponent } from './shared/ui/toast/toast-container.component';
import { ToastService } from './shared/ui/toast/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, BreadcrumbsComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('KarateFlow');
  protected isMobileMenuOpen = signal(false);

  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).toast = this.toastService;
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(val => !val);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
