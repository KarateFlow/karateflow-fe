import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { DashboardApiService, DashboardSummary } from '../data-access/dashboard-api.service';
import { AthletesApiService } from '../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../tests/data-access/tests-api.service';
import { Athlete } from '../../athletes/data-access/athlete.model';
import { ReportResponse } from '../../reports/data-access/reports.model';
import { firstValueFrom, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass],
  template: `
    <div class="page-container">
      <header class="page-header flex justify-between items-center">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="page-title m-0">Dashboard</h1>
          </div>
          <p class="text-muted">Benvenuto Coach! Ecco un riepilogo delle tue attività.</p>
          <p class="text-sm text-text-muted mt-1">{{ today | date }}</p>
        </div>
      </header>

      @if (summaryResource.isLoading() || !summaryResource.hasValue()) {
        <div class="flex justify-center items-center py-32">
          <div class="loader-spinner"></div>
        </div>
      } @else {
        <div class="dashboard-grid">
          <!-- Widget: Statistiche Atleti -->
          <div class="widget-card">
            <div class="widget-header">
              <div class="icon-wrapper bg-blue">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Atleti Totali</h3>
            </div>
            <div class="widget-body">
              <span class="stat-value">{{ summaryResource.value()?.summary?.totalAthletes ?? 0 }}</span>
            </div>
            <div class="widget-footer">
              <a routerLink="/athletes" class="quick-link">Vai alla lista atleti &rarr;</a>
            </div>
          </div>

          <!-- Widget: Ultimi Test -->
          <div class="widget-card">
            <div class="widget-header">
              <div class="icon-wrapper bg-green">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3>Test Registrati</h3>
            </div>
            <div class="widget-body">
              <span class="stat-value">{{ summaryResource.value()?.summary?.totalTests ?? 0 }}</span>
            </div>
            <div class="widget-footer">
              <span class="quick-link text-muted pointer-events-none" style="text-decoration: none; cursor: default;">Gestisci Template &rarr;</span>
            </div>
          </div>

          <!-- Widget: Report Generati -->
          <div class="widget-card">
            <div class="widget-header">
              <div class="icon-wrapper bg-purple">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Report Generati</h3>
            </div>
            <div class="widget-body">
              <span class="stat-value">{{ summaryResource.value()?.summary?.totalReports ?? 0 }}</span>
            </div>
            <div class="widget-footer">
              <span class="quick-link text-muted pointer-events-none" style="text-decoration: none; cursor: default;">Analizza i Report &rarr;</span>
            </div>
          </div>
        </div>

        <div class="recent-activities mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="widget-card">
            <div class="widget-header">
              <h3>Ultimi Test</h3>
            </div>
            <div class="widget-body p-0">
              <ul class="activity-list">
                @for (test of summaryResource.value()?.summary?.recentTests; track test.id) {
                  <li class="activity-item hover-item">
                    <a [routerLink]="['/athletes', test.athleteId, 'tests', test.id]" class="flex justify-between items-center w-full decoration-none">
                      <div class="flex flex-col gap-1">
                        <span class="font-medium activity-link">{{ getAthleteName(test.athleteId, summaryResource.value()?.athletes) }}</span>
                        <span class="text-sm text-muted">{{ test.exercises?.length || 0 }} esercizi</span>
                      </div>
                      <span class="text-sm text-muted whitespace-nowrap">{{ test.executionDate | date }}</span>
                    </a>
                  </li>
                } @empty {
                  <li class="activity-item text-muted p-4">Nessun test recente</li>
                }
              </ul>
            </div>
          </div>

          <div class="widget-card">
            <div class="widget-header">
              <h3>Ultimi Report</h3>
            </div>
            <div class="widget-body p-0">
              <ul class="activity-list">
                @for (report of summaryResource.value()?.summary?.recentReports; track report.reportId) {
                  <li class="activity-item hover-item">
                    <a [routerLink]="['/athletes', report.athleteId, 'reports', report.reportId]" class="flex items-center w-full decoration-none">
                      <!-- Column 1: Athlete + Info -->
                      <div class="flex flex-col gap-1 flex-1 min-w-0">
                        <span class="font-medium activity-link truncate">{{ getAthleteName(report.athleteId, summaryResource.value()?.athletes) }}</span>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium truncate">
                            @if (report.payload.analysisType === 'COMPARISON') {
                              @let compDates = summaryResource.value()?.comparisonDates?.[report.reportId];
                              {{ (compDates?.dateA | date) || 'Test A' }} - {{ (compDates?.dateB | date) || 'Test B' }}
                            } @else {
                              @let dates = getTrendDates(report);
                              {{ (dates.start | date) || 'Inizio' }} - {{ (dates.end | date) || 'Fine' }}
                            }
                          </span>
                          <span class="text-xs text-muted truncate">
                            {{ report.payload.analysisType === 'COMPARISON' ? 'Due test a confronto' : 'Intervallo di date' }}
                          </span>
                        </div>
                      </div>

                      <!-- Column 2: Improvement Badge -->
                      <div class="w-24 flex justify-center shrink-0">
                        @if (getOverallImprovement(report); as imp) {
                          <span class="text-xs font-bold px-2 py-0-5 rounded-full" [ngClass]="imp.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                            {{ imp.text }}
                          </span>
                        }
                      </div>

                      <!-- Column 3: Saved Date -->
                      <div class="w-32 flex justify-end shrink-0">
                        <span class="text-sm text-muted whitespace-nowrap">Salvato il:<br>{{ report.createdAt | date }}</span>
                      </div>
                    </a>
                  </li>
                } @empty {
                  <li class="activity-item text-muted p-4">Nessun report recente</li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .loader-spinner {
      border: 6px solid var(--color-border);
      border-top: 6px solid var(--color-primary-aka);
      border-radius: 50%;
      width: 80px;
      height: 80px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
    }

    @media (min-width: 768px) {
      .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .widget-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .widget-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .widget-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .bg-blue { background-color: #3b82f6; }
    .bg-green { background-color: #10b981; }
    .bg-purple { background-color: #8b5cf6; }

    .widget-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      line-height: 1;
    }

    .widget-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .quick-link {
      color: var(--color-primary-aka);
      font-weight: 700;
      font-size: 0.875rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: color 0.2s;
    }

    .quick-link:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    .activity-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .activity-item {
      border-bottom: 1px solid var(--color-border);
    }
    
    .hover-item:hover {
      background-color: var(--color-surface-hover, rgba(0,0,0,0.02));
    }

    .activity-item a {
      padding: 1rem;
      display: flex;
      width: 100%;
      text-decoration: none;
      color: inherit;
    }
    
    .activity-link {
      color: var(--color-primary);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .mt-8 { margin-top: 2rem; }
    .gap-6 { gap: 1.5rem; }
    .p-4 { padding: 1rem; }
    .p-0 { padding: 0 !important; }
    .w-full { width: 100%; }
    .w-24 { width: 6rem; }
    .font-medium { font-weight: 500; }

    .skeleton {
      background: linear-gradient(90deg, var(--color-surface-hover) 25%, var(--color-border) 50%, var(--color-surface-hover) 75%);
      background-size: 200% 100%;
      animation: skeletonLoading 1.5s infinite;
    }
    @keyframes skeletonLoading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .h-10 { height: 2.5rem; }
    .h-12 { height: 3rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .flex-col { flex-direction: column; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .whitespace-nowrap { white-space: nowrap; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-0-5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-full { border-radius: 9999px; }
    .text-xs { font-size: 0.75rem; }
    .bg-green-100 { background-color: #d1fae5; }
    .text-green-700 { color: #047857; }
    .bg-red-100 { background-color: #fee2e2; }
    .text-red-700 { color: #b91c1c; }
    .pointer-events-none { pointer-events: none; opacity: 0.5; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);
  
  protected readonly today = new Date();

  public readonly summaryResource = resource({
    loader: () => {
      return new Promise<{ summary: DashboardSummary, athletes: Athlete[], comparisonDates: Record<string, { dateA?: string, dateB?: string }> }>(resolve => {
        setTimeout(() => {
          firstValueFrom(
            forkJoin({
              summary: this.dashboardApi.getSummary(),
              athletes: this.athletesApi.getAthletes()
            })
          ).then(async data => {
            const comparisonDates: Record<string, { dateA?: string, dateB?: string }> = {};
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
    }
  });

  getAthleteName(athleteId: string, athletes: Athlete[] | undefined): string {
    if (!athletes) return 'Atleta sconosciuto';
    const athlete = athletes.find(a => a.athleteId === athleteId);
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atleta sconosciuto';
  }

  getTrendDates(report: ReportResponse): { start: string | undefined, end: string | undefined } {
    if (report.payload.startDate && report.payload.endDate) {
      return { start: report.payload.startDate, end: report.payload.endDate };
    }

    let start: string | undefined;
    let end: string | undefined;

    if (report.payload.exerciseTrends?.length) {
      report.payload.exerciseTrends.forEach(trend => {
        if (trend.dataPoints?.length) {
          const firstDate = trend.dataPoints[0].date;
          const lastDate = trend.dataPoints[trend.dataPoints.length - 1].date;
          if (!start || new Date(firstDate) < new Date(start)) {
            start = firstDate;
          }
          if (!end || new Date(lastDate) > new Date(end)) {
            end = lastDate;
          }
        }
      });
    }

    return { start, end };
  }

  getOverallImprovement(report: ReportResponse): { value: number, text: string, isPositive: boolean } | null {
    let percentages: number[] = [];

    if (report.payload.analysisType === 'COMPARISON') {
      if (!report.payload.comparisonResults?.length) return null;
      const validResults = report.payload.comparisonResults.filter(r => r.percentageChange && r.percentageChange !== 'N/A');
      percentages = validResults.map(r => parseFloat(r.percentageChange));
    } else if (report.payload.analysisType === 'TREND') {
      if (!report.payload.exerciseTrends?.length) return null;
      report.payload.exerciseTrends.forEach(trend => {
        if (trend.dataPoints && trend.dataPoints.length > 1) {
          const first = trend.dataPoints[0].result;
          const last = trend.dataPoints[trend.dataPoints.length - 1].result;
          if (first !== 0) {
            let change = ((last - first) / first) * 100;
            if (!trend.greaterIsBetter) {
              change = -change;
            }
            percentages.push(change);
          }
        }
      });
    }

    if (percentages.length === 0) return null;
    
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    const avg = sum / percentages.length;
    
    return {
      value: avg,
      text: avg > 0 ? `+${avg.toFixed(1)}%` : `${avg.toFixed(1)}%`,
      isPositive: avg > 0
    };
  }
}
