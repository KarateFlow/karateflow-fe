import { ChangeDetectionStrategy, Component, inject, resource, signal, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TemplatesApiService } from '../../data-access/templates-api.service';
import { CreateTestTemplateRequest, MeasurementUnit, TestTemplateResponse, UpdateTestTemplateRequest } from '../../data-access/test.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- HEADER CONDIZIONALE A SECONDA DELLO STATO -->
      <header class="page-header">
        @if (isViewingDetail() && !isEditing()) {
          <button (click)="closeDetail()" class="btn-back">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Torna ai Template
          </button>
          <div class="header-main">
            <div class="title-section">
              <h1>{{ selectedTemplate()?.name }}</h1>
              @if (selectedTemplate()?.description) {
                <p class="description">{{ selectedTemplate()?.description }}</p>
              }
            </div>
            <div class="header-actions">
              <button (click)="confirmDeleteCurrent()" class="btn-secondary danger">
                Elimina
              </button>
              <button (click)="startEdit(selectedTemplate()!)" class="btn-primary">
                Modifica
              </button>
            </div>
          </div>
        } @else if (isEditing()) {
          <button (click)="cancel()" class="btn-back">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Torna al Dettaglio
          </button>
          <div class="header-main">
            <div class="title-section">
              <h1>Modifica Template</h1>
              <p>Aggiorna le informazioni e l'elenco degli esercizi del template.</p>
            </div>
          </div>
        } @else if (isCreating()) {
          <button (click)="cancel()" class="btn-back">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Torna ai Template
          </button>
          <div class="header-main">
            <div class="title-section">
              <h1>Nuovo Template</h1>
              <p>Inserisci i dettagli e gli esercizi per il nuovo template.</p>
            </div>
          </div>
        } @else {
          <!-- LISTA / GENERAL HEADER -->
          <button routerLink="/" class="btn-back">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Torna alla Home
          </button>
          <div class="header-main">
            <div class="title-section">
              <h1>Gestione Template di Test</h1>
              <p>Configura modelli di esercizi predefiniti per velocizzare la registrazione delle sessioni.</p>
            </div>
            <button (click)="startCreate()" class="btn-primary">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuovo Template
            </button>
          </div>
        }
      </header>

      @if (templatesResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento dei template in corso...</p>
        </div>
      } @else if (templatesResource.error()) {
        <div class="error-state">
          <strong>Errore nel caricamento</strong>
          <p>Impossibile recuperare l'elenco dei template di test.</p>
          <button (click)="templatesResource.reload()" class="btn-retry">Riprova</button>
        </div>
      } @else {
        @if (!isEditing() && !isCreating() && !isViewingDetail()) {
          <!-- LISTA DEI TEMPLATE -->
          @if ((templatesResource.value() ?? []).length === 0) {
            <app-empty-state 
              title="Nessun template configurato" 
              message="Crea il tuo primo template di test per velocizzare l'inserimento dei dati degli atleti.">
              <svg icon xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <button actions (click)="startCreate()" class="btn-primary">Crea Template</button>
            </app-empty-state>
          } @else {
            <div class="templates-grid">
              @for (template of templatesResource.value(); track template.id) {
                <div 
                  class="template-card" 
                  (click)="viewDetail(template)"
                  tabindex="0"
                  (keydown.enter)="viewDetail(template)"
                >
                  <div class="card-header">
                     <div class="card-title-section">
                      <h3>{{ template.name }}</h3>
                      <span class="badge">{{ template.exercises.length }} esercizi</span>
                    </div>
                    @if (template.description) {
                      <p class="description">{{ template.description }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        } @else if (isViewingDetail() && !isEditing()) {
          <!-- DETTAGLIO TEMPLATE (READ-ONLY) -->
          <section class="detail-exercises-section">
            <h2>Esercizi Inclusi</h2>
            <div class="exercises-detail-list">
              @for (ex of selectedTemplate()?.exercises; track $index) {
                <div class="exercise-detail-row">
                  <div class="ex-info">
                    <span class="ex-number">#{{ $index + 1 }}</span>
                    <span class="ex-name">{{ ex.exerciseTitle }}</span>
                  </div>
                  <div class="ex-specs">
                    <span class="spec-badge">Unità: {{ ex.unit.toLowerCase() }}</span>
                    <span class="spec-badge trend" [class.higher]="ex.greaterIsBetter">
                      {{ ex.greaterIsBetter ? 'Alto è meglio' : 'Basso è meglio' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </section>
        } @else {
          <!-- FORM DI CREAZIONE / MODIFICA -->
          <form [formGroup]="templateForm" (ngSubmit)="onPreSubmitSave()" class="template-form">
            <section class="form-section">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label for="name">Nome Template</label>
                  <input 
                    id="name" 
                    type="text" 
                    formControlName="name" 
                    placeholder="Es. Test Fisico Iniziale, Screening..." 
                    [class.invalid]="isInvalid('name')"
                  />
                  @if (isInvalid('name')) {
                    <span class="error-msg">Il nome del template è obbligatorio</span>
                  }
                </div>
                
                <div class="form-group full-width">
                  <label for="description">Descrizione (Opzionale)</label>
                  <textarea 
                    id="description" 
                    formControlName="description" 
                    rows="2" 
                    placeholder="Fornisci dettagli o indicazioni sull'utilizzo di questo template..."
                  ></textarea>
                </div>
              </div>
            </section>

            <section class="exercises-section">
              <div class="section-header">
                <h2>Elenco Esercizi</h2>
                <button type="button" class="btn-add" (click)="addExercise()">
                  + Aggiungi Esercizio
                </button>
              </div>

              @if (exercises.controls.length === 0) {
                <div class="empty-exercises-state" [class.error]="exercises.touched && exercises.invalid">
                  <p>Nessun esercizio inserito. Aggiungi almeno un esercizio al template per poterlo salvare.</p>
                </div>
              }

              <div class="exercises-list">
                @for (ctrl of exercises.controls; track ctrl; let i = $index) {
                  <div [formGroup]="asFormGroup(ctrl)" class="exercise-row">
                    <div class="field title-field">
                      <label [for]="'title-'+i">Nome Esercizio</label>
                      <input 
                        [id]="'title-'+i" 
                        type="text" 
                        formControlName="exerciseTitle" 
                        placeholder="Es. Push-up, 100m sprint..." 
                        [class.invalid]="isControlInvalid(ctrl, 'exerciseTitle')"
                      />
                      @if (isControlInvalid(ctrl, 'exerciseTitle')) {
                        <span class="error-msg">Obbligatorio</span>
                      }
                    </div>
                    
                    <div class="field unit-field">
                      <label [for]="'unit-'+i">Unità</label>
                      <select [id]="'unit-'+i" formControlName="unit">
                        @for (unit of units; track unit) {
                          <option [value]="unit">{{ unit }}</option>
                        }
                      </select>
                    </div>

                    <div class="field toggle-field">
                      <span class="label-span">Tendenza</span>
                      <div class="toggle-container">
                        <input type="checkbox" formControlName="greaterIsBetter" [id]="'gib-'+i" />
                        <label [for]="'gib-'+i" class="toggle-label">
                          {{ ctrl.get('greaterIsBetter')?.value ? 'Alto è meglio' : 'Basso è meglio' }}
                        </label>
                      </div>
                    </div>

                    <div class="actions">
                      <button type="button" class="btn-icon" (click)="duplicateExercise(i)" title="Duplica esercizio">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                      <button type="button" class="btn-icon delete" (click)="removeExercise(i)" title="Rimuovi esercizio">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
              
              @if (exercises.touched && exercises.hasError('minlength')) {
                <div class="validation-error-banner">Inserire almeno un esercizio per poter salvare il template.</div>
              }
            </section>

            <footer class="form-actions">
              @if (isEditing()) {
                <button type="button" (click)="confirmDeleteCurrent()" class="btn-delete-form">
                  Elimina Template
                </button>
              }
              <div class="right-actions">
                <button type="button" (click)="cancel()" class="btn-cancel">
                  Annulla
                </button>
                <button type="submit" [disabled]="isSaving()" class="btn-save">
                  @if (isSaving()) {
                    Salvataggio...
                  } @else {
                    Salva Template
                  }
                </button>
              </div>
            </footer>
          </form>
        }
      }
    </div>

    <!-- DIALOG CONFERMA ELIMINAZIONE TEMPLATE -->
    <app-confirm-dialog
      [isOpen]="showDeleteConfirm()"
      title="Elimina Template"
      message="Sei sicuro di voler eliminare definitivamente questo template di test? Questa operazione non può essere annullata."
      confirmText="Sì, elimina"
      cancelText="Annulla"
      (confirmed)="onConfirmDelete()"
      (cancelled)="showDeleteConfirm.set(false)"
    />

    <!-- DIALOG CONFERMA SALVATAGGIO TEMPLATE -->
    <app-confirm-dialog
      [isOpen]="showSaveConfirm()"
      title="Salva Template"
      message="Vuoi procedere al salvataggio del template con le impostazioni attuali?"
      confirmText="Sì, salva"
      cancelText="Annulla"
      (confirmed)="onConfirmSave()"
      (cancelled)="showSaveConfirm.set(false)"
    />
  `,
  styles: `
    .page-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
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
      margin-bottom: 1rem;
    }

    .btn-back:hover {
      color: var(--color-primary-aka);
      background-color: var(--color-hover);
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }

    @media (max-width: 640px) {
      .header-main {
        flex-direction: column;
        align-items: flex-start;
      }
      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }

    .title-section h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin-bottom: 0.25rem;
    }

    .title-section p {
      color: var(--color-text-muted);
      font-size: 1.1rem;
    }

    .btn-primary {
      background-color: var(--color-primary-aka);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-xl);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }

    /* Grid of Cards */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .template-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .template-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08);
      border-color: var(--color-primary-aka);
    }

    .template-card.selected {
      border-color: var(--color-primary-aka);
      box-shadow: 0 8px 16px -2px rgba(37, 99, 235, 0.1);
    }

    .card-header {
      padding: 1.5rem;
    }

    .card-title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .card-title-section h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .badge {
      background-color: var(--color-hover);
      color: var(--color-text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-xl);
      white-space: nowrap;
    }

    .description {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin: 0.5rem 0 0;
      line-height: 1.5;
    }


    /* Form Styles */
    .template-form {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    input[type="text"], textarea, select {
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      font-family: inherit;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: var(--color-primary-aka);
    }

    input.invalid {
      border-color: var(--color-error);
      background-color: var(--color-error-bg);
    }

    .exercises-section {
      border-top: 1px solid var(--color-border);
      padding-top: 2rem;
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
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

    .empty-exercises-state {
      text-align: center;
      padding: 2rem;
      background: var(--color-bg-canvas);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
    }

    .empty-exercises-state.error {
      border-color: var(--color-error);
      background-color: var(--color-error-bg);
      color: var(--color-error);
    }

    /* Inline Exercise Row */
    .exercise-row {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr auto;
      gap: 1rem;
      align-items: flex-end;
      padding: 1rem;
      background: var(--color-bg-canvas);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
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

    @media (max-width: 480px) {
      .exercise-row {
        grid-template-columns: 1fr;
      }
      .unit-field { grid-column: 1 / -1; }
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

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0;
    }

    .toggle-label {
      font-size: 0.875rem !important;
      color: var(--color-text-main) !important;
      cursor: pointer;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 0.5rem;
      border-radius: var(--radius-xl);
      cursor: pointer;
      color: var(--color-text-muted);
      transition: all 0.2s;
    }

    .btn-icon:hover {
      border-color: var(--color-primary-aka);
      color: var(--color-primary-aka);
    }

    .btn-icon.delete:hover {
      border-color: var(--color-error);
      color: var(--color-error);
      background: var(--color-error-bg);
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border-top: 1px solid var(--color-border);
      padding-top: 1.5rem;
      margin-top: 2rem;
    }

    @media (max-width: 640px) {
      .form-actions {
        flex-direction: column-reverse;
        align-items: stretch;
      }
      .right-actions {
        flex-direction: column;
        margin-left: 0;
        width: 100%;
      }
      .btn-cancel, .btn-save, .btn-delete-form {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
    }

    .right-actions {
      display: flex;
      gap: 1rem;
      margin-left: auto;
    }

    .btn-delete-form {
      background: var(--color-surface);
      border: 1px solid var(--color-error-bg);
      color: var(--color-error);
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-delete-form:hover {
      background: var(--color-error-bg);
      border-color: var(--color-error);
    }

    .btn-save {
      background: var(--color-primary-aka);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-save:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      padding: 0.75rem 2rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: var(--color-bg-canvas);
      color: var(--color-text-main);
    }

    .validation-error-banner {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-bg);
      color: var(--color-error);
      padding: 1rem;
      border-radius: var(--radius-xl);
      margin-top: 1rem;
      font-weight: 600;
      text-align: center;
    }

    .error-msg {
      font-size: 0.75rem;
      color: var(--color-error);
      font-weight: 600;
    }

    /* Common States */
    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
      max-width: 400px;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .btn-secondary {
      background: var(--color-surface);
      border: 1px solid var(--color-primary-aka);
      color: var(--color-primary-aka);
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #eff6ff;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-hover);
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-retry {
      background: var(--color-surface);
      border: 1px solid var(--color-error);
      padding: 0.5rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      color: var(--color-error);
      cursor: pointer;
      margin-top: 1rem;
    }

    /* Detail View Styles */
    .detail-exercises-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-top: 1.5rem;
    }

    .detail-exercises-section h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1rem;
    }

    .exercises-detail-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .exercise-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
    }

    @media (max-width: 640px) {
      .exercise-detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .ex-specs {
        width: 100%;
        flex-wrap: wrap;
      }
    }

    .ex-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .ex-number {
      font-weight: 700;
      color: var(--color-primary-aka);
      background: #eff6ff;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .ex-name {
      font-weight: 600;
      color: var(--color-text-main);
      font-size: 1.05rem;
    }

    .ex-specs {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .spec-badge {
      font-size: 0.8rem;
      font-weight: 700;
      background: var(--color-border);
      color: var(--color-text-muted);
      padding: 0.3rem 0.75rem;
      border-radius: var(--radius-xl);
    }

    .spec-badge.trend {
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    .spec-badge.trend.higher {
      background: var(--color-success-bg);
      color: #166534;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-secondary.danger {
      border-color: var(--color-error-bg);
      color: var(--color-error);
      background: var(--color-surface);
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary.danger:hover {
      background: var(--color-error-bg);
      border-color: var(--color-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListPage implements OnDestroy {
  private readonly templatesApi = inject(TemplatesApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.breadcrumbService.routeClicked
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(url => {
        if (url === '/templates') {
          this.cancel();
          this.closeDetail();
        }
      });
  }

  protected readonly isEditing = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isViewingDetail = signal(false);
  protected readonly selectedTemplateId = signal<string | null>(null);
  protected readonly selectedTemplate = signal<TestTemplateResponse | null>(null);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly showSaveConfirm = signal(false);

  private templateIdToEdit: string | null = null;
  private templateIdToDelete: string | null = null;

  protected readonly templatesResource = resource({
    loader: () => firstValueFrom(this.templatesApi.getTemplates()),
  });

  protected readonly units = Object.values(MeasurementUnit);

  protected readonly templateForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.templateForm.get('exercises') as FormArray;
  }

  protected asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.templateForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected isControlInvalid(ctrl: AbstractControl, controlName: string): boolean {
    const control = ctrl.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected confirmDeleteCurrent(): void {
    const id = this.selectedTemplate()?.id || this.templateIdToEdit;
    if (id) {
      this.confirmDelete(id);
    }
  }

  protected viewDetail(template: TestTemplateResponse): void {
    this.selectedTemplate.set(template);
    this.isViewingDetail.set(true);
    this.isEditing.set(false);
    this.isCreating.set(false);
    this.breadcrumbService.setExtraCrumbs([{ label: template.name }]);
  }

  protected closeDetail(): void {
    this.isViewingDetail.set(false);
    this.selectedTemplate.set(null);
    this.breadcrumbService.clearExtraCrumbs();
  }

  protected startCreate(): void {
    this.templateForm.reset();
    this.exercises.clear();
    this.addExercise(); // Start with one empty exercise row
    this.isCreating.set(true);
    this.isEditing.set(false);
    this.breadcrumbService.setExtraCrumbs([{ label: 'Nuovo' }]);
  }

  protected startEdit(template: TestTemplateResponse): void {
    this.templateForm.patchValue({
      name: template.name,
      description: template.description || ''
    });

    this.exercises.clear();
    template.exercises.forEach(ex => {
      this.exercises.push(new FormGroup({
        exerciseTitle: new FormControl(ex.exerciseTitle, { nonNullable: true, validators: [Validators.required] }),
        unit: new FormControl(ex.unit, { nonNullable: true, validators: [Validators.required] }),
        greaterIsBetter: new FormControl(ex.greaterIsBetter, { nonNullable: true, validators: [Validators.required] }),
      }));
    });

    this.templateIdToEdit = template.id;
    this.isEditing.set(true);
    this.isCreating.set(false);
    this.breadcrumbService.setExtraCrumbs([
      { 
        label: template.name, 
        action: () => {
          this.isEditing.set(false);
          this.isViewingDetail.set(true);
          this.breadcrumbService.setExtraCrumbs([{ label: template.name }]);
        }
      }, 
      { label: 'Modifica' }
    ]);
  }

  protected addExercise(): void {
    const exerciseGroup = new FormGroup({
      exerciseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
    const newTitle = match ? `${match[1]} #${parseInt(match[2], 10) + 1}` : (title ? `${title} #2` : '');

    const duplicate = new FormGroup({
      exerciseTitle: new FormControl(newTitle, { nonNullable: true, validators: [Validators.required] }),
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

  protected cancel(): void {
    this.isCreating.set(false);
    this.isEditing.set(false);
    this.templateIdToEdit = null;
    this.templateForm.reset();
    if (this.isViewingDetail() && this.selectedTemplate()) {
      this.breadcrumbService.setExtraCrumbs([{ label: this.selectedTemplate()!.name }]);
    } else {
      this.breadcrumbService.clearExtraCrumbs();
    }
  }

  protected confirmDelete(templateId: string): void {
    this.templateIdToDelete = templateId;
    this.showDeleteConfirm.set(true);
  }

  protected async onConfirmDelete(): Promise<void> {
    this.showDeleteConfirm.set(false);
    if (!this.templateIdToDelete) return;

    try {
      await firstValueFrom(this.templatesApi.deleteTemplate(this.templateIdToDelete));
      this.toastService.success('Template eliminato con successo!');
      this.templatesResource.reload();
      this.selectedTemplateId.set(null);
      this.selectedTemplate.set(null);
      this.isViewingDetail.set(false);
      this.isEditing.set(false);
      this.templateIdToDelete = null;
      this.breadcrumbService.clearExtraCrumbs();
    } catch (error) {
      this.handleError(error);
    }
  }

  protected onPreSubmitSave(): void {
    if (this.templateForm.valid) {
      this.showSaveConfirm.set(true);
    } else {
      this.templateForm.markAllAsTouched();
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showSaveConfirm.set(false);
    this.isSaving.set(true);

    try {
      const payload = this.templateForm.getRawValue();
      if (this.isCreating()) {
        await firstValueFrom(this.templatesApi.createTemplate(payload as CreateTestTemplateRequest));
        this.toastService.success('Template creato con successo!');
        this.isCreating.set(false);
      } else if (this.isEditing() && this.templateIdToEdit) {
        await firstValueFrom(this.templatesApi.updateTemplate(this.templateIdToEdit, payload as UpdateTestTemplateRequest));
        this.toastService.success('Template aggiornato con successo!');
        const savedTemplate: TestTemplateResponse = {
          id: this.templateIdToEdit,
          name: payload.name,
          description: payload.description || undefined,
          exercises: (payload.exercises as { exerciseTitle: string; unit: MeasurementUnit; greaterIsBetter: boolean }[]).map(ex => ({
            exerciseTitle: ex.exerciseTitle,
            unit: ex.unit,
            greaterIsBetter: ex.greaterIsBetter
          })),
          createdAt: this.selectedTemplate()?.createdAt || new Date().toISOString()
        };
        this.selectedTemplate.set(savedTemplate);
        this.isEditing.set(false);
        this.breadcrumbService.setExtraCrumbs([{ label: savedTemplate.name }]);
      }
      this.templatesResource.reload();
      this.templateIdToEdit = null;
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private handleError(err: unknown): void {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 0) {
        this.toastService.error('Errore di connessione: il server non risponde. Controlla la tua connessione internet.');
      } else if (status === 400) {
        this.toastService.error('I dati inseriti non sono validi. Controlla i campi e riprova.');
      } else if (status >= 500) {
        this.toastService.error('Errore del server: si è verificato un problema interno.');
      } else {
        this.toastService.error('Si è verificato un errore inaspettato. Riprova più tardi.');
      }
    } else {
      this.toastService.error('Si è verificato un errore inaspettato. Riprova più tardi.');
    }
    console.error('Template operation failed', err);
  }

  ngOnDestroy(): void {
    this.breadcrumbService.clearExtraCrumbs();
  }
}
