import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReportPreviewRequest, ReportPreviewResponse, ReportSaveRequest, ReportResponse } from './reports.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  /**
   * Generates a preview comparison or trend report for an athlete.
   * @param request The preview parameters.
   * @returns An Observable of the report preview response.
   */
  generatePreview(request: ReportPreviewRequest): Observable<ReportPreviewResponse> {
    return this.http.post<ReportPreviewResponse>(`${this.apiUrl}/preview`, request);
  }

  saveReport(request: ReportSaveRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.apiUrl, request);
  }

  getReportsByAthlete(athleteId: string): Observable<ReportResponse[]> {
    return this.http.get<ReportResponse[]>(`${this.apiUrl}/athlete/${athleteId}`);
  }

  deleteReport(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reportId}`);
  }
}
