import { ChangeDetectionStrategy, Component, inject, input, output, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReportsApiService } from '../../data-access/reports-api.service';
import { ReportResponse } from '../../data-access/reports.model';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-saved-reports-list',
  standalone: true,
  imports: [DatePipe, ConfirmDialogComponent],
  template: `
    <div class="saved-reports-container">
      <div class="header-row">
        <h2 class="section-title">Storico Report Salvati</h2>
        <button type="button" class="btn-refresh" (click)="reportsResource.reload()">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Aggiorna
        </button>
      </div>

      @if (reportsResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento report salvati...</p>
        </div>
      } @else if (reportsResource.error()) {
        <div class="error-banner">
          <strong>Errore nel caricamento</strong>
          <p>Impossibile recuperare i report salvati. Riprova più tardi.</p>
          <button (click)="reportsResource.reload()" class="btn-retry">Riprova</button>
        </div>
      } @else if (reportsResource.value(); as reports) {
        @if (reports.length === 0) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p>Nessun report salvato per questo atleta. Genera un report e clicca su "Salva Report" per inserirlo nello storico.</p>
          </div>
        } @else {
          <div class="reports-grid">
            @for (report of reports; track report.reportId) {
              <div class="report-card">
                <div class="card-header">
                  <span class="report-badge">
                    {{ report.payload.analysisType === 'COMPARISON' ? 'Confronto A vs B' : 'Trend Temporale' }}
                  </span>
                  <span class="card-date">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                
                <div class="card-body">
                  @if (report.payload.analysisType === 'COMPARISON') {
                    <div class="report-details">
                      <div class="detail-item">
                        <span class="label">Test Baseline (A)</span>
                        <strong>{{ getTestDateFormatted(report.payload.testIdA) }}</strong>
                      </div>
                      <div class="detail-item">
                        <span class="label">Test Confronto (B)</span>
                        <strong>{{ getTestDateFormatted(report.payload.testIdB) }}</strong>
                      </div>
                    </div>
                  } @else {
                    <div class="report-details">
                      <div class="detail-item">
                        <span class="label">Periodo di Analisi</span>
                        <strong>{{ getTrendPeriod(report) }}</strong>
                      </div>
                    </div>
                  }
                </div>

                <div class="card-actions">
                  <button type="button" class="btn-action btn-view" (click)="viewReport.emit(report)">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Visualizza
                  </button>
                  <button type="button" class="btn-action btn-delete" (click)="requestDelete(report.reportId)">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Elimina
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <app-confirm-dialog
      [isOpen]="isConfirmOpen()"
      title="Elimina Report"
      message="Sei sicuro di voler eliminare questo report salvato? L'operazione non è reversibile."
      confirmText="Elimina"
      cancelText="Annulla"
      (confirmed)="onConfirmDelete()"
      (cancelled)="isConfirmOpen.set(false)"
    />
  `,
  styles: `
    .saved-reports-container {
      margin-top: 1.5rem;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin: 0;
    }

    .btn-refresh {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-xl);
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .btn-refresh:hover {
      background-color: var(--color-bg-canvas);
      border-color: var(--color-primary-aka);
      color: var(--color-primary-aka);
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .report-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      padding: 1.25rem;
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .report-badge {
      background-color: var(--color-hover);
      color: #1e40af;
      border: 1px solid #bfdbfe;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-xl);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .card-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .card-body {
      margin-bottom: 1.25rem;
      flex-grow: 1;
    }

    .report-details {
      background-color: var(--color-bg-canvas);
      padding: 0.85rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .detail-item .label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .detail-item strong {
      font-size: 0.875rem;
      color: var(--color-text-main);
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      border-top: 1px solid var(--color-border);
      padding-top: 1rem;
    }

    .btn-action {
      flex: 1;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem;
      border-radius: var(--radius-xl);
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-view {
      background-color: var(--color-hover);
      color: var(--color-primary-aka);
    }

    .btn-view:hover {
      background-color: var(--color-primary-aka);
      color: white;
    }

    .btn-delete { background-color: transparent; border: 1px solid var(--color-error); color: var(--color-error); display: flex; align-items: center; gap: 0.5rem; font-weight: 700; cursor: pointer; padding: 0.75rem 2rem; border-radius: var(--radius-xl); transition: all 0.2s; }

    .btn-delete:hover { background-color: var(--color-error); color: white; transform: translateY(-1px); }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 0;
      gap: 1.5rem;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-hover);
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error);
      padding: 2rem;
      border-radius: var(--radius-xl);
      text-align: center;
      color: var(--color-error);
    }

    .btn-retry {
      margin-top: 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-error);
      padding: 0.5rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 700;
      color: var(--color-error);
      cursor: pointer;
    }

    .empty-state {
      background-color: var(--color-surface);
      border: 2px dashed #cbd5e1;
      border-radius: var(--radius-xl);
      padding: 3rem 2rem;
      text-align: center;
      color: var(--color-text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .empty-state svg {
      color: #94a3b8;
    }

    .empty-state p {
      max-width: 450px;
      margin: 0;
      line-height: 1.6;
      font-size: 0.95rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedReportsListComponent {
  athleteId = input.required<string>();
  tests = input.required<TestResponse[]>();

  viewReport = output<ReportResponse>();

  private readonly reportsApi = inject(ReportsApiService);

  protected readonly reportsResource = resource({
    loader: () => firstValueFrom(this.reportsApi.getReportsByAthlete(this.athleteId())),
  });

  protected readonly isConfirmOpen = signal<boolean>(false);
  protected readonly reportToDelete = signal<string | null>(null);

  public reload(): void {
    this.reportsResource.reload();
  }

  protected getTestDateFormatted(testId: string | undefined): string {
    if (!testId) return 'N/D';
    const test = this.tests().find(t => t.id === testId);
    if (!test) return 'Test Inesistente';
    const date = new Date(test.executionDate);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected getTrendPeriod(report: ReportResponse): string {
    const payload = report.payload;
    let start = payload.startDate;
    let end = payload.endDate;

    if (!start || !end) {
      const dates: Date[] = [];
      payload.exerciseTrends?.forEach(t => {
        t.dataPoints?.forEach(dp => {
          if (dp.date) {
            dates.push(new Date(dp.date));
          }
        });
      });

      if (dates.length > 0) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        if (!start) start = dates[0].toISOString();
        if (!end) end = dates[dates.length - 1].toISOString();
      }
    }

    if (!start && !end) {
      return 'Nessun dato';
    }

    const format = (dStr: string | undefined) => {
      if (!dStr) return '';
      const date = new Date(dStr);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return `${start ? format(start) : 'Inizio'} - ${end ? format(end) : 'Fine'}`;
  }

  protected requestDelete(reportId: string): void {
    this.reportToDelete.set(reportId);
    this.isConfirmOpen.set(true);
  }

  protected onConfirmDelete(): void {
    const reportId = this.reportToDelete();
    if (reportId) {
      this.isConfirmOpen.set(false);
      this.reportsApi.deleteReport(reportId).subscribe({
        next: () => {
          this.reportsResource.reload();
          this.reportToDelete.set(null);
        },
        error: (err) => {
          console.error('Failed to delete report', err);
          alert('Impossibile eliminare il report. Riprova più tardi.');
          this.reportToDelete.set(null);
        }
      });
    }
  }
}
