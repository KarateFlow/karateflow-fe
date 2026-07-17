import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { DatePipe } from '@angular/common';
import { BreadcrumbService } from '../../../../shared/ui/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-athlete-edit',
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent, DatePipe],
  template: `
    <div class="page-container">
      <header class="page-header">
        <button [routerLink]="['/athletes', athleteId()]" class="btn-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Annulla e torna al profilo
        </button>
        <h1>Modifica Atleta</h1>
      </header>

      @if (athleteResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento dati atleta...</p>
        </div>
      } @else if (athleteResource.error()) {
        <div class="error-banner">
          <strong>Errore</strong>
          <p>Impossibile caricare i dati per la modifica.</p>
        </div>
      } @else if (athleteResource.value(); as athlete) {
        <div class="edit-card">
          <!-- Sola Lettura -->
          <section class="readonly-section">
            <div class="info-item">
              <span class="label">Nome</span>
              <p>{{ athlete.firstName }}</p>
            </div>
            <div class="info-item">
              <span class="label">Cognome</span>
              <p>{{ athlete.lastName }}</p>
            </div>
            <div class="info-item">
              <span class="label">Data di Nascita</span>
              <p>{{ athlete.birthDate | date:'dd/MM/yyyy' }}</p>
            </div>
          </section>

          <hr class="divider" />

          <!-- Form Editabile -->
          <form [formGroup]="editForm" (ngSubmit)="onPreSubmit()" class="edit-form">
            <div class="form-group">
              <label for="referenceContact">Contatto di Riferimento</label>
              <input
                id="referenceContact"
                type="text"
                formControlName="referenceContact"
                placeholder="Es. Genitore, Telefono o Email"
              />
            </div>

            <div class="form-group">
              <label for="medicalNotes">Note Mediche</label>
              <textarea
                id="medicalNotes"
                formControlName="medicalNotes"
                rows="4"
                placeholder="Es. Allergie, infortuni, certificati..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" [disabled]="editForm.pristine || isSubmitting()" class="btn-save">
                @if (isSubmitting()) {
                  Salvataggio...
                } @else {
                  Salva Modifiche
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>

    <!-- Modale di Conferma Custom -->
    <app-confirm-dialog
      [isOpen]="showConfirm()"
      title="Conferma Modifica"
      message="Sei sicuro di voler aggiornare i dati dell'atleta? L'operazione non può essere annullata."
      confirmText="Sì, salva"
      cancelText="Torna indietro"
      (confirmed)="onConfirmSave()"
      (cancelled)="showConfirm.set(false)"
    />
  `,
  styles: `
    .page-container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .page-header h1 {
      margin-top: 1rem;
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-text-main);
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

    .edit-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      border: 1px solid var(--color-border);
    }

    .readonly-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 0.25rem;
    }

    .info-item p {
      font-weight: 600;
      color: var(--color-text-muted);
      margin: 0;
    }

    .divider {
      border: 0;
      border-top: 1px solid var(--color-border);
      margin: 2rem 0;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
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

    input, textarea {
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--color-primary-aka);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .btn-save {
      background-color: var(--color-primary-aka);
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
      transform: translateY(-1px);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-hover);
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastService = inject(ToastService);

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly showConfirm = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly editForm = new FormGroup({
    referenceContact: new FormControl(''),
    medicalNotes: new FormControl(''),
  });

  protected readonly athleteResource = resource({
    loader: async () => {
      const athlete = await firstValueFrom(this.athletesApi.getAthlete(this.athleteId()));
      this.breadcrumbService.setLabel(this.athleteId(), `${athlete.firstName} ${athlete.lastName}`);
      this.editForm.patchValue({
        referenceContact: athlete.referenceContact ?? '',
        medicalNotes: athlete.medicalNotes ?? '',
      });
      return athlete;
    },
  });

  protected onPreSubmit(): void {
    if (this.editForm.valid) {
      this.showConfirm.set(true);
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showConfirm.set(false);
    this.isSubmitting.set(true);

    try {
      const payload = {
        referenceContact: this.editForm.value.referenceContact,
        medicalNotes: this.editForm.value.medicalNotes,
      };

      await firstValueFrom(this.athletesApi.updateAthlete(this.athleteId(), payload));
      this.toastService.success('Dati aggiornati con successo!');
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      this.isSubmitting.set(false);
      this.toastService.error('Errore durante il salvataggio dei dati.');
    }
  }
}
