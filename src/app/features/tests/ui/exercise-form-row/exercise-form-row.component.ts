import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MeasurementUnit } from '../../data-access/test.model';

@Component({
  selector: 'app-exercise-form-row',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="formGroup()" class="exercise-row">
      <div class="field title-field">
        <label [for]="'title-'+index()">Esercizio</label>
        <input [id]="'title-'+index()" type="text" formControlName="exerciseTitle" placeholder="Titolo" />
      </div>
      
      <div class="field result-field">
        <label [for]="'result-'+index()">Risultato</label>
        <input [id]="'result-'+index()" type="number" formControlName="result" step="0.01" placeholder="0.00" />
      </div>
      
      <div class="field unit-field">
        <label [for]="'unit-'+index()">Unità</label>
        <select [id]="'unit-'+index()" formControlName="unit">
          @for (unit of units; track unit) {
            <option [value]="unit">{{ unit }}</option>
          }
        </select>
      </div>

      <div class="field toggle-field">
        <span class="label-span">Tendenza</span>
        <div class="toggle-container">
          <input type="checkbox" formControlName="greaterIsBetter" [id]="'gib-'+index()" />
          <label [for]="'gib-'+index()" class="toggle-label">
            {{ formGroup().get('greaterIsBetter')?.value ? 'Più è alto, meglio è' : 'Più è basso, meglio è' }}
          </label>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn-icon" (click)="duplicate.emit()" title="Duplica riga">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button type="button" class="btn-icon delete" (click)="remove.emit()" title="Rimuovi riga">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: `
    .exercise-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 2fr auto;
      gap: 1rem;
      align-items: flex-end;
      padding: 1rem;
      background: #f8fafc;
      border-radius: var(--radius-lg);
      border: 1px solid #e2e8f0;
      margin-bottom: 0.75rem;
    }

    @media (max-width: 768px) {
      .exercise-row {
        grid-template-columns: 1fr 1fr;
      }
      .title-field { grid-column: 1 / -1; }
      .toggle-field { grid-column: 1 / -1; }
      .actions { grid-column: 1 / -1; justify-content: flex-end; }
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .field label, .label-span {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    input, select {
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
    }

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0;
    }

    .toggle-label {
      text-transform: none !important;
      font-size: 0.85rem !important;
      color: var(--color-text-main) !important;
      cursor: pointer;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.4rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--color-text-muted);
      transition: all 0.2s;
    }

    .btn-icon:hover {
      border-color: var(--color-primary-aka);
      color: var(--color-primary-aka);
    }

    .btn-icon.delete:hover {
      border-color: #ef4444;
      color: #ef4444;
      background: #fef2f2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseFormRowComponent {
  formGroup = input.required<FormGroup>();
  index = input.required<number>();
  
  duplicate = output<void>();
  remove = output<void>();

  protected readonly units = Object.values(MeasurementUnit);
}
