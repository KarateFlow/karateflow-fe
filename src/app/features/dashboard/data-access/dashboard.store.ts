import { Injectable, inject, resource } from '@angular/core';
import { DashboardApiService, DashboardSummary } from './dashboard-api.service';
import { AthletesApiService } from '../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../tests/data-access/tests-api.service';
import { Athlete } from '../../athletes/data-access/athlete.model';
import { firstValueFrom, forkJoin } from 'rxjs';

export interface DashboardData {
  summary: DashboardSummary;
  athletes: Athlete[];
  comparisonDates: Record<string, { dateA?: string; dateB?: string }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);

  public readonly summaryResource = resource<DashboardData, unknown>({
    loader: () => {
      return new Promise<DashboardData>(resolve => {
        setTimeout(() => {
          firstValueFrom(
            forkJoin({
              summary: this.dashboardApi.getSummary(),
              athletes: this.athletesApi.getAthletes(),
            })
          ).then(async data => {
            const comparisonDates: Record<string, { dateA?: string; dateB?: string }> = {};
            const testCache: Record<string, string> = {};

            const getTestDate = async (testId?: string) => {
              if (!testId) return undefined;
              if (testCache[testId]) return testCache[testId];
              try {
                const test = await firstValueFrom(this.testsApi.getTest(testId));
                if (test && test.executionDate) {
                  testCache[testId] = test.executionDate;
                  return test.executionDate;
                }
              } catch {
                // Ignore errors to not block dashboard load
              }
              return undefined;
            };

            const reports = data.summary?.recentReports || [];
            for (const report of reports) {
              if (report.payload.analysisType === 'COMPARISON') {
                const dateA = await getTestDate(report.payload.testIdA);
                const dateB = await getTestDate(report.payload.testIdB);
                comparisonDates[report.reportId] = { dateA, dateB };
              }
            }

            resolve({ ...data, comparisonDates });
          });
        }, 600);
      });
    },
  });
}
