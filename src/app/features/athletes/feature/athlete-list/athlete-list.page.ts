import { ChangeDetectionStrategy, Component, inject, resource, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { AthleteCardListComponent } from '../../ui/athlete-card-list/athlete-card-list.component';
import { Athlete } from '../../data-access/athlete.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';

@Component({
  selector: 'app-athlete-list',
  imports: [RouterLink, AthleteCardListComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Anagrafica Atleti</h1>
          <p>Gestisci e visualizza tutti gli atleti iscritti all'accademia.</p>
        </div>
        <button routerLink="../new" class="btn-primary">
          <span class="icon">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span> 
          Nuovo Atleta
        </button>
      </header>

      @if (athletesResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner-container">
            <div class="spinner"></div>
            <div class="spinner-inner"></div>
          </div>
          <p>Sincronizzazione dati in corso...</p>
        </div>
      } @else if (athletesResource.error()) {
        <div class="banner error-banner">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="content">
            <strong>{{ getErrorTitle(athletesResource.error()) }}</strong>
            <p>{{ getErrorMessage(athletesResource.error()) }}</p>
          </div>
          <button class="retry-btn" (click)="athletesResource.reload()">Riprova</button>
        </div>
      } @else if (athletesResource.value()?.length === 0) {
        <app-empty-state 
          title="Nessun atleta registrato" 
          message="Non ci sono ancora atleti nell'accademia. Aggiungine uno per iniziare.">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <button actions routerLink="../new" class="btn-primary">Aggiungi Atleta</button>
        </app-empty-state>
      } @else {
        <section class="list-actions">
          <div class="search-container">
            <span class="search-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input type="text" placeholder="Cerca atleta..." [value]="searchTerm()" (input)="onSearch($event)" class="search-input" />
          </div>
        </section>
        <section class="list-section">
          <app-athlete-card-list 
            [athletes]="filteredAthletes()" 
            (view)="onViewAthlete($event)"
          />
        </section>
      }
    </div>
  `,
  styles: `
    .page-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }

    .list-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }

    .search-container {
      position: relative;
      width: 100%;
      max-width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    input[type="text"].search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      background-color: var(--color-surface);
      color: var(--color-text-main);
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;
    }

    input[type="text"].search-input:focus {
      outline: none;
      border-color: var(--color-primary-aka);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    @media (max-width: 640px) {
      .search-container {
        max-width: 100%;
      }
    }

    .page-header h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: var(--color-text-muted);
      font-size: 1.1rem;
    }

    .btn-primary {
      background-color: var(--color-primary-aka);
      color: white;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: var(--radius-xl);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8rem 0;
      gap: 2rem;
      color: var(--color-text-muted);
    }

    .spinner-container {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .spinner {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 4px solid var(--color-hover);
      border-top: 4px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
    }

    .spinner-inner {
      position: absolute;
      top: 15%;
      left: 15%;
      width: 70%;
      height: 70%;
      border: 4px solid transparent;
      border-top: 4px solid var(--color-secondary-ao);
      border-radius: 50%;
      animation: spin 0.8s linear infinite reverse;
      opacity: 0.5;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .banner {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      margin-bottom: 2rem;
    }

    .error-banner {
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error);
      color: var(--color-error);
    }

    .error-icon {
      flex-shrink: 0;
      padding-top: 0.25rem;
    }

    .retry-btn {
      margin-left: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-error);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-xl);
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-error);
      cursor: pointer;
      transition: all 0.2s;
    }

    .retry-btn:hover {
      background: #ffe4e6;
      transform: scale(1.02);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteListPage {
  private readonly athletesApi = inject(AthletesApiService);
  private readonly router = inject(Router);

  protected readonly athletesResource = resource({
    loader: () => firstValueFrom(this.athletesApi.getAthletes()),
  });

  protected readonly searchTerm = signal<string>('');

  protected readonly filteredAthletes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const athletes = this.athletesResource.value() ?? [];
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

  protected getErrorTitle(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Connessione Fallita';
      if (error.status === 404) return 'Risorsa non Trovata';
      if (error.status === 403) return 'Accesso Negato';
      return `Errore del Server (${error.status})`;
    }
    return 'Errore Inaspettato';
  }

  protected getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Impossibile raggiungere il backend. Verifica la tua connessione o lo stato del server.';
      if (error.status === 404) return 'L\'elenco degli atleti non è al momento disponibile sul server.';
      if (error.status >= 500) return 'Il server ha riscontrato un problema interno. Riprova tra qualche istante.';
    }
    return 'Si è verificato un errore durante il recupero dei dati. I nostri tecnici sono stati avvisati.';
  }
}
