import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecordAthleteRequest } from '../../data-access/athlete.model';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { AthleteFormComponent } from '../../ui/athlete-form/athlete-form.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-athlete-create',
  imports: [AthleteFormComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Registrazione Nuovo Atleta</h1>
        <p>Inserisci i dati anagrafici e medici dell'atleta per inserirlo nel sistema.</p>
      </header>

      @if (successMessage()) {
        <div class="banner success-banner">
          <span class="icon">✅</span>
          <div class="content">
            <strong>Successo!</strong>
            <p>{{ successMessage() }}</p>
          </div>
          <button class="close-btn" (click)="successMessage.set(null)">&times;</button>
        </div>
      }

      @if (errorMessage()) {
        <div class="banner error-banner">
          <span class="icon">⚠️</span>
          <div class="content">
            <strong>Attenzione</strong>
            <p>{{ errorMessage() }}</p>
          </div>
          <button class="close-btn" (click)="errorMessage.set(null)">&times;</button>
        </div>
      }

      <section class="form-section">
        <app-athlete-form [isSubmitting]="isSubmitting()" (save)="onSave($event)" />
      </section>

      <div class="page-actions">
        <button class="btn-secondary" (click)="goBack()" [disabled]="isSubmitting()">
          Annulla e Torna Indietro
        </button>
      </div>
    </div>
  `,
  styles: `
    .page-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header p {
      color: var(--color-text-muted);
      margin-top: 0.5rem;
    }

    .banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: var(--radius-xl);
      position: relative;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .success-banner {
      background-color: var(--color-success-bg);
      border: 1px solid #10b981;
      color: #065f46;
    }

    .error-banner {
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-secondary-ao);
      color: var(--color-error);
    }

    .banner .icon {
      font-size: 1.25rem;
    }

    .banner .content strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .banner .content p {
      font-size: 0.875rem;
      margin: 0;
    }

    .close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: inherit;
      opacity: 0.5;
    }

    .close-btn:hover {
      opacity: 1;
    }

    .page-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .btn-secondary {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-main);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-xl);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--color-hover);
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteCreatePage {
  private readonly athletesApi = inject(AthletesApiService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected onSave(request: RecordAthleteRequest): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.athletesApi.createAthlete(request).subscribe({
      next: (athlete) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Atleta ${athlete.firstName} ${athlete.lastName} registrato con successo!`);
        
        // Reindirizzamento ritardato per permettere di leggere il messaggio di successo
        setTimeout(() => {
          this.router.navigate(['/athletes']);
        }, 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleError(err);
      },
    });
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 0) {
      this.errorMessage.set('Errore di connessione: il server non risponde. Controlla la tua connessione internet o riprova più tardi.');
    } else if (err.status === 400) {
      this.errorMessage.set('I dati inseriti non sono validi. Controlla i campi del form e riprova.');
    } else if (err.status === 409) {
      this.errorMessage.set('Questo atleta risulta già registrato nel sistema.');
    } else if (err.status >= 500) {
      this.errorMessage.set('Errore del server: si è verificato un problema interno. Il team tecnico è stato avvisato.');
    } else {
      this.errorMessage.set('Si è verificato un errore inaspettato durante la registrazione. Riprova più tardi.');
    }
    console.error('Athlete creation failed', err);
  }

  protected goBack(): void {
    this.router.navigate(['/athletes']);
  }
}
