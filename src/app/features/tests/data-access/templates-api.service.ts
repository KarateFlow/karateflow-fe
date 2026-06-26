import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateTestTemplateRequest, TestTemplateResponse, UpdateTestTemplateRequest } from './test.model';

@Injectable({
  providedIn: 'root',
})
export class TemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/templates`;

  createTemplate(request: CreateTestTemplateRequest): Observable<TestTemplateResponse> {
    return this.http.post<TestTemplateResponse>(this.apiUrl, request);
  }

  getTemplates(): Observable<TestTemplateResponse[]> {
    return this.http.get<TestTemplateResponse[]>(this.apiUrl);
  }

  getTemplate(id: string): Observable<TestTemplateResponse> {
    return this.http.get<TestTemplateResponse>(`${this.apiUrl}/${id}`);
  }

  updateTemplate(id: string, request: UpdateTestTemplateRequest): Observable<TestTemplateResponse> {
    return this.http.put<TestTemplateResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
