import { Injectable, inject, signal, resource } from '@angular/core';
import { AthletesApiService } from './athletes-api.service';
import { Athlete } from './athlete.model';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AthleteStore {
  private readonly api = inject(AthletesApiService);

  // Global state for athletes list
  readonly athletesResource = resource({
    loader: () => firstValueFrom(this.api.getAthletes()),
  });

  // Global state for a selected athlete (could be managed via route parameters in the component,
  // but caching it here allows fast navigation back and forth)
  readonly selectedAthleteId = signal<string | null>(null);

  readonly selectedAthleteResource = resource({
    loader: () => {
      const id = this.selectedAthleteId();
      if (!id) return Promise.resolve(null);
      return firstValueFrom(this.api.getAthlete(id));
    },
  });

  // Actions
  selectAthlete(id: string | null): void {
    this.selectedAthleteId.set(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createAthlete(request: any): Promise<Athlete> {
    const athlete = await firstValueFrom(this.api.createAthlete(request));
    this.athletesResource.reload();
    return athlete;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateAthlete(id: string, request: any): Promise<Athlete> {
    const athlete = await firstValueFrom(this.api.updateAthlete(id, request));
    this.athletesResource.reload();
    if (this.selectedAthleteId() === id) {
      this.selectedAthleteResource.reload();
    }
    return athlete;
  }

  // Derived state / Error handling helpers
  getErrorTitle(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Connessione Fallita';
      if (error.status === 404) return 'Risorsa non Trovata';
      if (error.status === 403) return 'Accesso Negato';
      return `Errore del Server (${error.status})`;
    }
    return 'Errore Inaspettato';
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Impossibile raggiungere il backend. Verifica la tua connessione o lo stato del server.';
      if (error.status === 404) return 'I dati richiesti non sono disponibili sul server.';
      if (error.status >= 500) return 'Il server ha riscontrato un problema interno. Riprova tra qualche istante.';
    }
    return 'Si è verificato un errore durante il recupero dei dati.';
  }

  getFormErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Errore di connessione: il server non risponde.';
      if (error.status === 400) return 'I dati inseriti non sono validi. Controlla i campi del form e riprova.';
      if (error.status === 409) return 'Questo atleta risulta già registrato nel sistema.';
      if (error.status >= 500) return 'Errore del server: si è verificato un problema interno.';
    }
    return 'Si è verificato un errore inaspettato. Riprova più tardi.';
  }
}
