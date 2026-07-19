import { Injectable, inject, resource, signal } from '@angular/core';
import { ReportsApiService } from './reports-api.service';
import { ReportPreviewRequest, ReportPreviewResponse, ReportSaveRequest, ReportResponse } from './reports.model';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  private readonly reportsApi = inject(ReportsApiService);

  private readonly currentAthleteId = signal<string | null>(null);

  public readonly reportsResource = resource<ReportResponse[], string | null>({
    params: () => this.currentAthleteId(),
    loader: ({ params: athleteId }) => {
      if (!athleteId) return Promise.resolve([]);
      return firstValueFrom(this.reportsApi.getReportsByAthlete(athleteId));
    },
  });

  public loadReportsForAthlete(athleteId: string): void {
    this.currentAthleteId.set(athleteId);
  }

  public saveReport(request: ReportSaveRequest): Observable<ReportResponse> {
    return this.reportsApi.saveReport(request);
  }

  public deleteReport(reportId: string): Observable<void> {
    return this.reportsApi.deleteReport(reportId);
  }

  public generatePreview(request: ReportPreviewRequest): Observable<ReportPreviewResponse> {
    return this.reportsApi.generatePreview(request);
  }
}
