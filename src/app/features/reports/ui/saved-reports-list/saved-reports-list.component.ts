import { ChangeDetectionStrategy, Component, inject, input, output, resource, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { firstValueFrom } from 'rxjs';
import { ReportsStore } from '../../data-access/reports.store';
import { ReportResponse } from '../../data-access/reports.model';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-saved-reports-list',
  standalone: true,
  imports: [DatePipe, ConfirmDialogComponent, EmptyStateComponent],
  templateUrl: './saved-reports-list.component.html',
  styleUrl: './saved-reports-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedReportsListComponent {
  athleteId = input.required<string>();
  tests = input.required<TestResponse[]>();
  autoOpenReportId = input<string | null>(null);

  viewReport = output<ReportResponse>();

  private readonly reportsStore = inject(ReportsStore);
  private readonly toastService = inject(ToastService);

  constructor() {
    effect(() => {
      this.reportsStore.loadReportsForAthlete(this.athleteId());
    });
    
    // Effetto per l'apertura automatica del report quando i report sono caricati
    effect(() => {
      const reports = this.reportsStore.reportsResource.value();
      const reportId = this.autoOpenReportId();
      if (reports && reports.length > 0 && reportId) {
        // Troviamo il report sia per reportId che per id per supportare eventuali mock backend
        const report = reports.find(r => r.reportId === reportId || (r as any).id === reportId);
        if (report) {
          // Usiamo untracked o setTimeout per evitare error NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
          setTimeout(() => this.viewReport.emit(report), 0);
        }
      }
    });
  }

  protected readonly isConfirmOpen = signal<boolean>(false);
  protected readonly reportToDelete = signal<string | null>(null);

  protected get reportsResource() {
    return this.reportsStore.reportsResource;
  }

  public reload(): void {
    this.reportsStore.reportsResource.reload();
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
      this.reportsStore.deleteReport(reportId).subscribe({
        next: () => {
          this.toastService.success('Report eliminato con successo!');
          this.reportsStore.reportsResource.reload();
          this.reportToDelete.set(null);
        },
        error: (err) => {
          console.error('Failed to delete report', err);
          this.toastService.error('Impossibile eliminare il report. Riprova più tardi.');
          this.reportToDelete.set(null);
        }
      });
    }
  }
}
