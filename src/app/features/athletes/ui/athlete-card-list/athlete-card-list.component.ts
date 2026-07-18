import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Athlete } from '../../data-access/athlete.model';

@Component({
  selector: 'app-athlete-card-list',
  imports: [DatePipe],
  templateUrl: './athlete-card-list.component.html',
  styleUrl: './athlete-card-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteCardListComponent {
  athletes = input.required<Athlete[]>();
  view = output<Athlete>();

  protected getInitials(athlete: Athlete): string {
    return `${athlete.firstName.charAt(0)}${athlete.lastName.charAt(0)}`;
  }
}
