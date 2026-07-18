import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { TestResponse } from '../../tests/data-access/test.model';
import { ReportResponse } from '../../reports/data-access/reports.model';

export interface DashboardSummary {
  totalAthletes: number;
  totalTests: number;
  totalReports: number;
  recentTests: TestResponse[];
  recentReports: ReportResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  /**
   * Retrieves aggregated data for the dashboard.
   */
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`).pipe(
      catchError(() => of({
        totalAthletes: 0,
        totalTests: 0,
        totalReports: 0,
        recentTests: [],
        recentReports: []
      }))
    );
  }
}
