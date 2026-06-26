import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { CreateTestRequest, MeasurementUnit } from '../../data-access/test.model';
import { ExerciseFormRowComponent } from '../../ui/exercise-form-row/exercise-form-row.component';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';

/**
 * Validator to ensure date is not in the future
 */
export function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, unknown> | null => {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value as string);
    const now = new Date();
    return selectedDate > now ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-test-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ExerciseFormRowComponent, ConfirmDialogComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <button [routerLink]="['/athletes', athleteId()]" class="btn-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Torna al profilo
        </button>
        
        @if (athleteResource.value(); as athlete) {
          <div class="athlete-info">
            <h1>Nuova Sessione di Test</h1>
            <p>Atleta: <strong>{{ athlete.firstName }} {{ athlete.lastName }}</strong></p>
          </div>
        }
      </header>

      <form [formGroup]="testForm" (ngSubmit)="onPreSubmit()" class="test-form">
        <section class="session-details">
          <div class="form-grid">
            <div class="form-group">
              <label for="executionDate">Data Esecuzione</label>
              <input 
                id="executionDate" 
                type="datetime-local" 
                formControlName="executionDate" 
                [class.invalid]="isInvalid('executionDate')"
              />
              @if (isInvalid('executionDate')) {
                <span class="error-msg">
                  {{ testForm.get('executionDate')?.hasError('futureDate') ? 'La data non può essere futura' : 'La data è obbligatoria' }}
                </span>
              }
            </div>
            
            <div class="form-group">
              <label for="type">Tipologia Sessione</label>
              <input id="type" type="text" formControlName="type" placeholder="Es. Screening stagionale, Test Forza..." />
            </div>
          </div>

          <div class="form-group full-width">
            <label for="coachNotes">Note del Coach (Opzionali)</label>
            <textarea id="coachNotes" formControlName="coachNotes" rows="2" placeholder="Annotazioni generali sulla sessione..."></textarea>
          </div>
        </section>

        <section class="exercises-section">
          <div class="section-header">
            <h2>Esercizi Svolti</h2>
            <button type="button" class="btn-add" (click)="addExercise()">
              + Aggiungi Esercizio
            </button>
          </div>

          @if (exercises.controls.length === 0) {
            <div class="empty-state" [class.error]="exercises.touched && exercises.invalid">
              <p>Nessun esercizio aggiunto. Clicca sul tasto sopra per iniziare.</p>
            </div>
          }

          <div class="exercises-list">
            @for (ctrl of exercises.controls; track ctrl; let i = $index) {
              <app-exercise-form-row 
                [formGroup]="asFormGroup(ctrl)" 
                [index]="i"
                (duplicate)="duplicateExercise(i)"
                (remove)="removeExercise(i)"
              />
            }
          </div>
          
          @if (exercises.touched && exercises.hasError('minlength')) {
            <div class="error-banner">Inserire almeno un esercizio per poter salvare la sessione.</div>
          }
        </section>

        <footer class="form-actions">
          <button type="submit" [disabled]="isSubmitting()" class="btn-save">
            @if (isSubmitting()) {
              Registrazione in corso...
            } @else {
              Salva Sessione
            }
          </button>
        </footer>
      </form>
    </div>

    <app-confirm-dialog
      [isOpen]="showConfirm()"
      title="Registra Sessione"
      message="Stai per salvare questa sessione di test. Confermi che i dati inseriti sono corretti?"
      confirmText="Sì, salva"
      cancelText="Rivedi"
      (confirmed)="onConfirmSave()"
      (cancelled)="showConfirm.set(false)"
    />
  `,
  styles: `
    .page-container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .athlete-info h1 {
      margin: 1rem 0 0.25rem;
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-text-main);
    }

    .athlete-info p {
      color: var(--color-text-muted);
      font-size: 1.1rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }

    .btn-back:hover {
      color: var(--color-primary-aka);
      background-color: #f1f5f9;
    }

    .session-details {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width { grid-column: 1 / -1; }

    label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    input, textarea {
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-lg);
      font-family: inherit;
      transition: border-color 0.2s;
    }

    input.invalid {
      border-color: #ef4444;
      background-color: #fff1f2;
    }

    .exercises-section {
      margin-bottom: 3rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .btn-add {
      background: var(--color-secondary-ao);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-lg);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-add:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: #f8fafc;
      border: 2px dashed #e2e8f0;
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
      transition: all 0.2s;
    }

    .empty-state.error {
      border-color: #fca5a5;
      background-color: #fff1f2;
      color: #b91c1c;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      padding: 2rem 0;
      border-top: 1px solid #e2e8f0;
    }

    .btn-save {
      background: var(--color-primary-aka);
      color: white;
      border: none;
      padding: 1rem 4rem;
      border-radius: var(--radius-xl);
      font-size: 1.1rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
    }

    .btn-save:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: scale(1.02);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-msg {
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 600;
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #b91c1c;
      padding: 1rem;
      border-radius: var(--radius-lg);
      margin-top: 1rem;
      font-weight: 600;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCreatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly isSubmitting = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly athleteResource = resource({
    loader: () => firstValueFrom(this.athletesApi.getAthlete(this.athleteId())),
  });

  protected readonly testForm = new FormGroup({
    athleteId: new FormControl(this.athleteId(), { nonNullable: true, validators: [Validators.required] }),
    executionDate: new FormControl(this.getCurrentDateTime(), { nonNullable: true, validators: [Validators.required, noFutureDateValidator()] }),
    type: new FormControl(''),
    coachNotes: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.testForm.get('exercises') as FormArray;
  }

  protected addExercise(): void {
    const exerciseGroup = new FormGroup({
      exerciseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      result: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      unit: new FormControl(MeasurementUnit.CM, { nonNullable: true, validators: [Validators.required] }),
      greaterIsBetter: new FormControl(true, { nonNullable: true, validators: [Validators.required] }),
    });
    this.exercises.push(exerciseGroup);
    this.exercises.markAsDirty();
  }

  protected duplicateExercise(index: number): void {
    const source = this.exercises.at(index) as FormGroup;
    const title = source.value.exerciseTitle as string;
    const match = title.match(/(.*?)\s*#(\d+)$/);
    const newTitle = match ? `${match[1]} #${parseInt(match[2], 10) + 1}` : `${title} #2`;

    const duplicate = new FormGroup({
      exerciseTitle: new FormControl(newTitle, { nonNullable: true, validators: [Validators.required] }),
      result: new FormControl(source.value.result as number, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      unit: new FormControl(source.value.unit as MeasurementUnit, { nonNullable: true, validators: [Validators.required] }),
      greaterIsBetter: new FormControl(source.value.greaterIsBetter as boolean, { nonNullable: true, validators: [Validators.required] }),
    });
    this.exercises.push(duplicate);
    this.exercises.markAsDirty();
  }

  protected removeExercise(index: number): void {
    this.exercises.removeAt(index);
    this.exercises.markAsDirty();
  }

  protected asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.testForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected onPreSubmit(): void {
    if (this.testForm.valid) {
      this.showConfirm.set(true);
    } else {
      this.testForm.markAllAsTouched();
      // Mark FormArray and all its groups as touched
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showConfirm.set(false);
    this.isSubmitting.set(true);

    try {
      const payload = this.testForm.getRawValue();
      await firstValueFrom(this.testsApi.createTest(payload as CreateTestRequest));
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      console.error('Errore durante il salvataggio del test:', error);
      this.isSubmitting.set(false);
    }
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}
