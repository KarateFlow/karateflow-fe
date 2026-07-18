import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, Theme } from '../../../core/theme/theme.service';
import { UiSelectComponent } from '../../../shared/ui/ui-select/ui-select.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectComponent],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  public themeService = inject(ThemeService);

  onThemeChange(theme: string) {
    this.themeService.setTheme(theme as Theme);
  }
}
