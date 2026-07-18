import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { DashboardStore } from '../data-access/dashboard.store';
import { getAthleteName, getTrendDates, getOverallImprovement } from '../utils/dashboard.utils';
import { DashboardStatsWidgetComponent } from '../ui/dashboard-stats-widget/dashboard-stats-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, DashboardStatsWidgetComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage {
  protected readonly store = inject(DashboardStore);
  
  protected readonly today = new Date();
  // Expose pure functions to template
  protected readonly getAthleteName = getAthleteName;
  protected readonly getTrendDates = getTrendDates;
  protected readonly getOverallImprovement = getOverallImprovement;
}
