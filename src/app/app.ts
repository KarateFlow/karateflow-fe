import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { ToastService } from './shared/components/toast/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('KarateFlow');

  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  constructor() {
    //
  }
}
