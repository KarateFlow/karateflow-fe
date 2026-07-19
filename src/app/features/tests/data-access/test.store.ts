import { Injectable, inject, resource, signal } from '@angular/core';
import { TestsApiService } from './tests-api.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CreateTestRequest, UpdateTestRequest, TestResponse } from './test.model';

@Injectable({ providedIn: 'root' })
export class TestStore {
  private readonly api = inject(TestsApiService);

  // Global state for a selected test
  readonly selectedTestId = signal<string | null>(null);

  readonly selectedTestResource = resource<TestResponse | null, string | null>({
    params: () => this.selectedTestId(),
    loader: ({ params: id }) => {
      if (!id) return Promise.resolve(null);
      return firstValueFrom(this.api.getTest(id));
    },
  });

  // Global state for tests by athlete
  readonly selectedAthleteId = signal<string | null>(null);

  readonly testsByAthleteResource = resource<TestResponse[], string | null>({
    params: () => this.selectedAthleteId(),
    loader: ({ params: id }) => {
      if (!id) return Promise.resolve([]);
      return firstValueFrom(this.api.getTestsByAthlete(id));
    },
  });

  selectTest(id: string | null): void {
    this.selectedTestId.set(id);
  }

  selectAthlete(id: string | null): void {
    this.selectedAthleteId.set(id);
  }

  async createTest(request: CreateTestRequest) {
    const result = await firstValueFrom(this.api.createTest(request));
    this.testsByAthleteResource.reload();
    return result;
  }

  async updateTest(id: string, request: UpdateTestRequest) {
    const result = await firstValueFrom(this.api.updateTest(id, request));
    if (this.selectedTestId() === id) {
      this.selectedTestResource.reload();
    }
    this.testsByAthleteResource.reload();
    return result;
  }

  async deleteTest(id: string) {
    await firstValueFrom(this.api.deleteTest(id));
    this.testsByAthleteResource.reload();
  }

  // Error handling helpers
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
      if (error.status === 400) return 'I dati inseriti non sono validi. Controlla i campi del form e riprova.';
      if (error.status === 404) return 'I dati richiesti non sono disponibili sul server.';
      if (error.status >= 500) return 'Il server ha riscontrato un problema interno. Riprova tra qualche istante.';
    }
    return "Si è verificato un errore inaspettato durante l'operazione.";
  }
}
