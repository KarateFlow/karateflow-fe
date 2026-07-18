import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TestResponse } from '../../data-access/test.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';

@Component({
  selector: 'app-athlete-tests-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, EmptyStateComponent],
  template: `
    <div class="tests-history">
      <div class="history-header">
        <h3>Storico Performance</h3>
        <span class="count-badge">{{ tests().length }} sessioni</span>
      </div>

      @if (tests().length === 0) {
        <app-empty-state 
          title="Nessun test trovato" 
          message="Nessuna sessione di test registrata per questo atleta.">
          <svg icon viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </app-empty-state>
      } @else {
        <div class="sessions-list">
          @for (test of tests(); track test.id) {
            <article class="session-card" [class.expanded]="expandedId() === test.id">
              <header 
                class="session-summary" 
                (click)="toggleExpand(test.id)"
                (keydown.enter)="toggleExpand(test.id)"
                (keydown.space)="toggleExpand(test.id)"
                tabindex="0"
                role="button"
                [attr.aria-expanded]="expandedId() === test.id"
              >
                <div class="date-info">
                  <span class="date">{{ test.executionDate | date }}</span>
                  <span class="time">{{ test.executionDate | date }}</span>
                </div>
                
                <div class="main-info">
                  <span class="type">{{ test.type || 'Sessione Standard' }}</span>
                  <span class="exercises-count">{{ test.exercises.length }} esercizi svolti</span>
                </div>

                <div class="chevron">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </header>

              @if (expandedId() === test.id) {
                <div class="session-detail">
                  @if (test.coachNotes) {
                    <div class="notes">
                      <strong>Note del Coach:</strong>
                      <p>{{ test.coachNotes }}</p>
                    </div>
                  }

                  <div class="exercises-table-container">
                    <table class="exercises-table">
                      <thead>
                        <tr>
                          <th>Esercizio</th>
                          <th class="text-right">Risultato</th>
                          <th>Unità</th>
                          <th>Tendenza</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ex of test.exercises.slice(0, 5); track $index) {
                          <tr>
                            <td class="font-bold" data-label="Esercizio"><span class="truncate-text">{{ ex.exerciseTitle }}</span></td>
                            <td class="text-right result-val" data-label="Risultato">{{ ex.result | number:'1.1-2' }}</td>
                            <td class="unit" data-label="Unità">{{ ex.unit.toLowerCase() }}</td>
                            <td data-label="Tendenza">
                              <span class="trend-tag" [class.higher]="ex.greaterIsBetter">
                                {{ ex.greaterIsBetter ? 'Alto è meglio' : 'Basso è meglio' }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  
                  @if (test.exercises.length > 5) {
                    <div class="more-exercises-hint">
                      ...e altri {{ test.exercises.length - 5 }} esercizi. Clicca su "Gestisci / Dettagli" per visualizzare la sessione completa.
                    </div>
                  }

                  <div class="session-actions">
                    <a [routerLink]="['tests', test.id]" class="btn-manage-test">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Gestisci / Dettagli
                    </a>
                  </div>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .tests-history {
      margin-top: 3rem;
    }

    .history-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .history-header h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin: 0;
    }

    .count-badge {
      background: var(--color-hover);
      color: var(--color-text-muted);
      padding: 0.4rem 1rem;
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-width: 2.5rem;
    }

    .empty-history {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--color-bg-canvas);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
    }

    .empty-history svg {
      margin-bottom: 1rem;
      opacity: 0.4;
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .session-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all 0.2s;
    }

    .session-card:hover {
      border-color: var(--color-primary-aka);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .session-card.expanded {
      border-color: var(--color-primary-aka);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .session-summary {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      gap: 2rem;
      outline: none;
    }

    .session-summary:focus-visible {
      background: var(--color-hover);
      box-shadow: inset 0 0 0 2px var(--color-primary-aka);
    }

    .date-info {
      display: flex;
      flex-direction: column;
      min-width: 100px;
    }

    .date-info .date {
      font-weight: 700;
      color: var(--color-text-main);
    }

    .date-info .time {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .main-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .main-info .type {
      font-weight: 700;
      color: var(--color-text-main);
    }

    .main-info .exercises-count {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .chevron {
      color: var(--color-text-muted);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .expanded .chevron {
      transform: rotate(180deg);
      color: var(--color-primary-aka);
    }

    .session-detail {
      padding: 1.5rem;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg-canvas);
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .notes {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--color-surface);
      border-left: 4px solid var(--color-secondary-ao);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      font-size: 0.9rem;
    }

    .notes p {
      margin: 0.25rem 0 0;
      color: var(--color-text-muted);
    }

    .exercises-table-container {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      overflow: hidden;
    }

    .exercises-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .exercises-table th {
      background: var(--color-bg-canvas);
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }

    .exercises-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .exercises-table tr:last-child td {
      border-bottom: none;
    }

    .text-right { text-align: right !important; }
    .font-bold { font-weight: 700; color: var(--color-text-main); }
    .result-val { font-size: 1.1rem; font-weight: 800; color: var(--color-primary-aka); }
    .unit { color: var(--color-text-muted); font-weight: 600; }

    .truncate-text {
      display: inline-block;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }

    .trend-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full);
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    .trend-tag.higher {
      background: var(--color-success-bg);
      color: #166534;
    }

    @media (max-width: 640px) {
      .session-summary {
        gap: 1rem;
        padding: 1rem;
      }
      .date-info { min-width: 80px; }
      .exercises-table thead {
        display: none;
      }
      .exercises-table, .exercises-table tbody, .exercises-table tr, .exercises-table td {
        display: block;
        width: 100%;
      }
      .exercises-table tr {
        margin-bottom: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: 0.5rem 1rem;
      }
      .exercises-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: right !important;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--color-border);
      }
      .exercises-table td:last-child {
        border-bottom: none;
      }
      .exercises-table td::before {
        content: attr(data-label);
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-size: 0.75rem;
        text-align: left;
      }
    }

    .session-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .more-exercises-hint {
      margin-top: 0.75rem;
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-style: italic;
      font-weight: 500;
    }

    .btn-manage-test {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--color-primary-aka);
      color: white;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-xl);
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
    }

    .btn-manage-test:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteTestsListComponent {
  tests = input.required<TestResponse[]>();
  
  protected readonly expandedId = signal<string | null>(null);

  protected toggleExpand(id: string): void {
    this.expandedId.update(current => current === id ? null : id);
  }
}
