import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { MeasurementUnit, TestResponse, UpdateTestRequest } from '../../data-access/test.model';
import { ExerciseFormRowComponent } from '../../ui/exercise-form-row/exercise-form-row.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-test-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, DecimalPipe, ExerciseFormRowComponent, ConfirmDialogComponent],
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
            <h1>Dettaglio Sessione di Test</h1>
            <p>Atleta: <strong>{{ athlete.firstName }} {{ athlete.lastName }}</strong></p>
          </div>
        }
      </header>

      @if (testResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento dettagli sessione...</p>
        </div>
      } @else if (testResource.error()) {
        <div class="error-banner">
          <strong>Errore nel caricamento</strong>
          <p>Impossibile recuperare i dettagli del test. Riprova più tardi.</p>
          <button (click)="testResource.reload()" class="btn-retry">Riprova</button>
        </div>
      } @else if (testResource.value(); as test) {
        @if (!isEditing()) {
          <!-- VISTA READ-ONLY -->
          <section class="session-info-card">
            <div class="info-grid">
              <div class="info-group">
                <span class="label">Data Esecuzione</span>
                <p>{{ test.executionDate | date }}</p>
              </div>
              <div class="info-group">
                <span class="label">Tipologia Sessione</span>
                <p>{{ test.type || 'Sessione Standard' }}</p>
              </div>
              <div class="info-group">
                <span class="label">Data Registrazione</span>
                <p>{{ test.createdAt | date }}</p>
              </div>
            </div>

            @if (test.coachNotes) {
              <div class="notes-section">
                <span class="label">Note del Coach</span>
                <div class="notes-content">
                  {{ test.coachNotes }}
                </div>
              </div>
            }
          </section>

          <section class="exercises-section">
            <div class="section-header">
              <h2>Esercizi Svolti</h2>
              <span class="count-badge">{{ test.exercises.length }} esercizi</span>
            </div>

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
                  @for (ex of test.exercises; track $index) {
                    <tr>
                      <td class="font-bold">{{ ex.exerciseTitle }}</td>
                      <td class="text-right result-val">{{ ex.result | number:'1.1-2' }}</td>
                      <td class="unit">{{ ex.unit.toLowerCase() }}</td>
                      <td>
                        <span class="trend-tag" [class.higher]="ex.greaterIsBetter">
                          {{ ex.greaterIsBetter ? 'Alto è meglio' : 'Basso è meglio' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <footer class="page-actions">
            <button (click)="startEdit(test)" class="btn-edit">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Modifica Test
            </button>
            <button (click)="showDeleteConfirm.set(true)" class="btn-delete">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Elimina Test
            </button>
          </footer>
        } @else {
          <!-- VISTA DI EDITING (FORM) -->
          <form [formGroup]="testForm" (ngSubmit)="onPreSubmitSave()" class="test-form">
            <section class="session-details">
              <div class="form-grid">
                <div class="form-group">
                  <label for="executionDateReadOnly">Data Esecuzione (Non Modificabile)</label>
                  <input id="executionDateReadOnly" type="text" [value]="test.executionDate | date" disabled class="input-disabled" />
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
                <h2>Modifica Esercizi</h2>
                <button type="button" class="btn-add" (click)="addExercise()">
                  + Aggiungi Esercizio
                </button>
              </div>

              @if (exercises.controls.length === 0) {
                <div class="empty-state" [class.error]="exercises.touched && exercises.invalid">
                  <p>Nessun esercizio presente. Aggiungi almeno un esercizio per poter salvare.</p>
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
              <button type="button" (click)="cancelEdit()" class="btn-cancel">
                Annulla
              </button>
              <button type="submit" [disabled]="isSaving()" class="btn-save">
                @if (isSaving()) {
                  Salvataggio...
                } @else {
                  Salva Modifiche
                }
              </button>
            </footer>
          </form>
        }
      }
    </div>

    <!-- DIALOG CONFERMA SALVATAGGIO MODIFICHE -->
    <app-confirm-dialog
      [isOpen]="showSaveConfirm()"
      title="Salva Modifiche"
      message="Stai per salvare le modifiche apportate a questa sessione di test. Confermi che i dati inseriti sono corretti?"
      confirmText="Sì, salva"
      cancelText="Rivedi"
      (confirmed)="onConfirmSave()"
      (cancelled)="showSaveConfirm.set(false)"
    />

    <!-- DIALOG CONFERMA CANCELLAZIONE TEST -->
    <app-confirm-dialog
      [isOpen]="showDeleteConfirm()"
      title="Elimina Sessione"
      message="Sei sicuro di voler eliminare definitivamente questa sessione di test? L'operazione non è reversibile."
      confirmText="Sì, elimina"
      cancelText="Annulla"
      (confirmed)="onConfirmDelete()"
      (cancelled)="showDeleteConfirm.set(false)"
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
      border-radius: var(--radius-xl);
      transition: all 0.2s;
    }

    .btn-back:hover {
      color: var(--color-primary-aka);
      background-color: var(--color-hover);
    }

    .session-info-card, .session-details {
      background: var(--color-surface);
      padding: 2rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      margin-bottom: 2rem;
    }

    .info-grid, .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .info-group, .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width { grid-column: 1 / -1; }

    .label, label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .info-group p {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-main);
      margin: 0;
    }

    .notes-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .notes-section .label {
      margin-bottom: 0.75rem;
    }

    .notes-content {
      background-color: #fafcfe;
      border-left: 4px solid var(--color-secondary-ao);
      padding: 1.25rem 1.5rem;
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
      color: var(--color-text-main);
      line-height: 1.6;
    }

    .exercises-section {
      margin-bottom: 2.5rem;
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

    .count-badge {
      background: var(--color-hover);
      color: var(--color-text-muted);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .exercises-table-container {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
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

    .page-actions, .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 0;
      border-top: 1px solid var(--color-border);
      margin-top: 2rem;
    }

    .btn-edit, .btn-save {
      background-color: var(--color-primary-aka);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.75rem 2rem;
      border-radius: var(--radius-xl);
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-edit:hover, .btn-save:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }

    .btn-delete { background-color: transparent; border: 1px solid var(--color-error); color: var(--color-error); display: flex; align-items: center; gap: 0.5rem; font-weight: 700; cursor: pointer; padding: 0.75rem 2rem; border-radius: var(--radius-xl); transition: all 0.2s; }

    .btn-delete:hover { background-color: var(--color-error); color: white; transform: translateY(-1px); }

    .btn-cancel {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      font-weight: 700;
      cursor: pointer;
      padding: 0.75rem 2rem;
      border-radius: var(--radius-xl);
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background-color: var(--color-bg-canvas);
      color: var(--color-text-main);
    }

    /* Form Fields */
    input, textarea {
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      font-family: inherit;
      transition: border-color 0.2s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--color-primary-aka);
    }

    .input-disabled {
      background-color: var(--color-bg-canvas);
      color: var(--color-text-muted);
      cursor: not-allowed;
      border-color: var(--color-border);
    }

    .btn-add {
      background: var(--color-secondary-ao);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-xl);
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
      background: var(--color-bg-canvas);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
    }

    .empty-state.error {
      border-color: var(--color-error);
      background-color: var(--color-error-bg);
      color: var(--color-error);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 0;
      gap: 1.5rem;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-hover);
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error);
      padding: 2rem;
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .btn-retry {
      margin-top: 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-error);
      padding: 0.5rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      color: var(--color-error);
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastService = inject(ToastService);

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly testId = signal(this.route.snapshot.paramMap.get('testId')!);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly showSaveConfirm = signal(false);
  protected readonly showDeleteConfirm = signal(false);

  protected readonly athleteResource = resource({
    loader: async () => {
      const athlete = await firstValueFrom(this.athletesApi.getAthlete(this.athleteId()));
      this.breadcrumbService.setLabel(this.athleteId(), `${athlete.firstName} ${athlete.lastName}`);
      return athlete;
    },
  });

  protected readonly testResource = resource({
    loader: () => firstValueFrom(this.testsApi.getTest(this.testId())),
  });

  protected readonly testForm = new FormGroup({
    type: new FormControl(''),
    coachNotes: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.testForm.get('exercises') as FormArray;
  }

  protected startEdit(test: TestResponse): void {
    this.testForm.patchValue({
      type: test.type || '',
      coachNotes: test.coachNotes || ''
    });

    this.exercises.clear();
    test.exercises.forEach(ex => {
      const group = new FormGroup({
        exerciseTitle: new FormControl(ex.exerciseTitle, { nonNullable: true, validators: [Validators.required] }),
        result: new FormControl<number | null>(ex.result, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        unit: new FormControl(ex.unit, { nonNullable: true, validators: [Validators.required] }),
        greaterIsBetter: new FormControl(ex.greaterIsBetter, { nonNullable: true, validators: [Validators.required] }),
      });
      this.exercises.push(group);
    });

    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.testForm.reset();
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

  protected onPreSubmitSave(): void {
    if (this.testForm.valid) {
      this.showSaveConfirm.set(true);
    } else {
      this.testForm.markAllAsTouched();
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showSaveConfirm.set(false);
    this.isSaving.set(true);

    try {
      const payload = this.testForm.getRawValue();
      await firstValueFrom(this.testsApi.updateTest(this.testId(), payload as UpdateTestRequest));
      this.toastService.success('Test aggiornato con successo!');
      this.testResource.reload();
      this.isEditing.set(false);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del test:', error);
      this.toastService.error('Errore durante l\'aggiornamento del test. Riprova più tardi.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async onConfirmDelete(): Promise<void> {
    this.showDeleteConfirm.set(false);
    try {
      await firstValueFrom(this.testsApi.deleteTest(this.testId()));
      this.toastService.success('Test eliminato con successo!');
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      console.error('Errore durante l\'eliminazione del test:', error);
      this.toastService.error('Errore durante l\'eliminazione del test. Riprova più tardi.');
    }
  }
}
