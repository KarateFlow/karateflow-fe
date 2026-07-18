import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-stats-widget',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-stats-widget.component.html',
  styleUrl: './dashboard-stats-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardStatsWidgetComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: number | string;
  @Input({ required: true }) iconBgClass!: string; // e.g. 'bg-blue'
  @Input() footerText?: string;
  @Input() footerLink?: string;
}
