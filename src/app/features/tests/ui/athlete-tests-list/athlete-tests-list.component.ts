import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TestResponse } from '../../data-access/test.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-athlete-tests-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, EmptyStateComponent],
  templateUrl: './athlete-tests-list.component.html',
  styleUrl: './athlete-tests-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteTestsListComponent {
  tests = input.required<TestResponse[]>();
  
  protected readonly expandedId = signal<string | null>(null);
  protected readonly searchTerm = signal<string>('');

  protected readonly filteredTests = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const tests = this.tests();
    if (!term) return tests;
    return tests.filter(t => {
      const type = (t.type || 'Sessione Standard').toLowerCase();
      const notes = (t.coachNotes || '').toLowerCase();
      return type.includes(term) || notes.includes(term);
    });
  });

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  protected toggleExpand(id: string): void {
    this.expandedId.update(current => current === id ? null : id);
  }
}
