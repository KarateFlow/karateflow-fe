import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AthleteStore } from '../../data-access/athlete.store';
import { AthleteCardListComponent } from '../../ui/athlete-card-list/athlete-card-list.component';
import { Athlete } from '../../data-access/athlete.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-athlete-list',
  standalone: true,
  imports: [AthleteCardListComponent, EmptyStateComponent, UiButtonComponent],
  templateUrl: './athlete-list.page.html',
  styleUrl: './athlete-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteListPage {
  protected readonly store = inject(AthleteStore);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal<string>('');

  protected readonly filteredAthletes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const athletes = this.store.athletesResource.value() ?? [];
    if (!term) return athletes;
    return athletes.filter(a => {
      const name = `${a.firstName} ${a.lastName}`.toLowerCase();
      return name.includes(term);
    });
  });

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  protected onViewAthlete(athlete: Athlete): void {
    this.router.navigate(['/athletes', athlete.athleteId]);
  }

  protected onNewAthlete(): void {
    this.router.navigate(['/athletes/new']);
  }
}
