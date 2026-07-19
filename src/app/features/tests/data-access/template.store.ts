import { Injectable, inject, resource } from '@angular/core';
import { TemplatesApiService } from './templates-api.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CreateTestTemplateRequest, UpdateTestTemplateRequest } from './test.model';

@Injectable({ providedIn: 'root' })
export class TemplateStore {
  private readonly api = inject(TemplatesApiService);

  // Global state for templates list
  readonly templatesResource = resource({
    loader: () => firstValueFrom(this.api.getTemplates()),
  });

  async createTemplate(request: CreateTestTemplateRequest) {
    const result = await firstValueFrom(this.api.createTemplate(request));
    this.templatesResource.reload();
    return result;
  }

  async updateTemplate(id: string, request: UpdateTestTemplateRequest) {
    const result = await firstValueFrom(this.api.updateTemplate(id, request));
    this.templatesResource.reload();
    return result;
  }

  async deleteTemplate(id: string) {
    await firstValueFrom(this.api.deleteTemplate(id));
    this.templatesResource.reload();
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
      if (error.status === 400) return 'I dati inseriti non sono validi. Controlla i campi e riprova.';
      if (error.status === 404) return 'I dati richiesti non sono disponibili sul server.';
      if (error.status >= 500) return 'Il server ha riscontrato un problema interno. Riprova tra qualche istante.';
    }
    return "Si è verificato un errore durante l'operazione.";
  }
}
