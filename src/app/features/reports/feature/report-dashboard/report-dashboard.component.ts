import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ReportsStore } from '../../data-access/reports.store';
import { ReportPreviewResponse, ReportResponse } from '../../data-access/reports.model';
import { Athlete } from '../../../athletes/data-access/athlete.model';
import { ChartDataPoint, ReportChartComponent } from '../../ui/report-chart/report-chart.component';
import { calculateReportSummaryStats, isPositive, isNegative, formatDeltaSign, formatPctSign } from '../../utils/reports.utils';
import { exportReportToPDF } from '../../utils/pdf-export.utils';

import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../../shared/ui/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule, ReportChartComponent, UiInputComponent, UiSelectComponent, UiButtonComponent],
  templateUrl: './report-dashboard.component.html',
  styleUrl: './report-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDashboardComponent {
  athleteId = input.required<string>();
  tests = input.required<TestResponse[]>();
  savedReport = input<ReportResponse | null>(null);
  athlete = input<Athlete | null>(null);

  reportSaved = output<void>();

  private readonly reportsStore = inject(ReportsStore);
  private readonly toastService = inject(ToastService);

  protected readonly analysisType = signal<'COMPARISON' | 'TREND'>('COMPARISON');
  protected readonly testIdA = signal<string>('');
  protected readonly testIdB = signal<string>('');
  protected readonly startDate = signal<string>('');
  protected readonly endDate = signal<string>('');

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly reportIsSaved = signal<boolean>(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly reportResult = signal<ReportPreviewResponse | null>(null);

  protected readonly selectedExerciseForChart = signal<string>('');
  protected readonly isExportingPDF = signal<boolean>(false);

  // Expose pure functions to template
  protected readonly isPositive = isPositive;
  protected readonly isNegative = isNegative;
  protected readonly formatDeltaSign = formatDeltaSign;
  protected readonly formatPctSign = formatPctSign;

  protected readonly reportSummaryStats = computed(() => {
    return calculateReportSummaryStats(this.reportResult());
  });

  constructor() {
    effect(() => {
      const list = this.tests();
      if (list.length >= 2) {
        // Setup initial default selected tests
        // Since tests are sorted descending (newest first), the last item is the oldest.
        this.testIdA.set(list[list.length - 1].id);
        this.testIdB.set(list[0].id);
      } else if (list.length === 1) {
        this.testIdA.set(list[0].id);
      }
    });

    effect(() => {
      const saved = this.savedReport();
      if (saved) {
        this.reportResult.set(saved.payload);
        this.analysisType.set(saved.payload.analysisType);
        if (saved.payload.analysisType === 'COMPARISON') {
          this.testIdA.set(saved.payload.testIdA || '');
          this.testIdB.set(saved.payload.testIdB || '');
        } else {
          this.startDate.set(saved.payload.startDate || '');
          this.endDate.set(saved.payload.endDate || '');
        }

        // Auto select first available exercise for the chart
        const isComparison = saved.payload.analysisType === 'COMPARISON';
        const res = saved.payload;
        if (isComparison && res.comparisonResults && res.comparisonResults.length > 0) {
          const chartable = res.comparisonResults.find(c => c.resultA !== null && c.resultB !== null);
          if (chartable) {
            this.selectedExerciseForChart.set(chartable.exerciseTitle);
          } else {
            this.selectedExerciseForChart.set(res.comparisonResults[0].exerciseTitle);
          }
        } else if (!isComparison && res.exerciseTrends && res.exerciseTrends.length > 0) {
          this.selectedExerciseForChart.set(res.exerciseTrends[0].exerciseTitle);
        }
      }
    });
  }

  protected setAnalysisType(type: 'COMPARISON' | 'TREND'): void {
    this.analysisType.set(type);
    this.reportResult.set(null);
    this.errorMsg.set(null);
    this.selectedExerciseForChart.set('');
    this.reportIsSaved.set(false);
  }

  protected onSaveReport(): void {
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const isComparison = this.analysisType() === 'COMPARISON';
    
    const requestPayload = {
      analysisType: this.analysisType(),
      athleteId: this.athleteId(),
      testIdA: isComparison ? this.testIdA() : undefined,
      testIdB: isComparison ? this.testIdB() : undefined,
      startDate: !isComparison && this.startDate() ? new Date(this.startDate()).toISOString() : undefined,
      endDate: !isComparison && this.endDate() ? new Date(this.endDate()).toISOString() : undefined,
    };

    this.reportsStore.saveReport(requestPayload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.reportIsSaved.set(true);
        this.toastService.success('Report salvato con successo!');
        this.reportSaved.emit();
      },
      error: (err) => {
        console.error('Failed to save report', err);
        this.isSaving.set(false);
        this.errorMsg.set(
          err?.error?.message || 
          'Impossibile salvare il report. Riprova più tardi.'
        );
      }
    });
  }

  protected onGenerate(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.reportResult.set(null);
    this.selectedExerciseForChart.set('');
    this.reportIsSaved.set(false);

    const isComparison = this.analysisType() === 'COMPARISON';
    
    const requestPayload = {
      analysisType: this.analysisType(),
      athleteId: this.athleteId(),
      testIdA: isComparison ? this.testIdA() : undefined,
      testIdB: isComparison ? this.testIdB() : undefined,
      startDate: !isComparison && this.startDate() ? new Date(this.startDate()).toISOString() : undefined,
      endDate: !isComparison && this.endDate() ? new Date(this.endDate()).toISOString() : undefined,
    };

    this.reportsStore.generatePreview(requestPayload).subscribe({
      next: (res) => {
        this.reportResult.set(res);
        this.isLoading.set(false);

        // Auto select first available exercise for the chart
        if (isComparison && res.comparisonResults && res.comparisonResults.length > 0) {
          // Select the first exercise that is present in both tests (so we can chart it)
          const chartable = res.comparisonResults.find(c => c.resultA !== null && c.resultB !== null);
          if (chartable) {
            this.selectedExerciseForChart.set(chartable.exerciseTitle);
          } else {
            this.selectedExerciseForChart.set(res.comparisonResults[0].exerciseTitle);
          }
        } else if (!isComparison && res.exerciseTrends && res.exerciseTrends.length > 0) {
          this.selectedExerciseForChart.set(res.exerciseTrends[0].exerciseTitle);
        }
      },
      error: (err) => {
        console.error('Failed to generate report preview', err);
        this.isLoading.set(false);
        this.errorMsg.set(
          err?.error?.message || 
          'Impossibile caricare i dati del confronto. Assicurati che le date o i test selezionati siano corretti.'
        );
      }
    });
  }

  // Computed list of exercises available for rendering in the chart
  protected readonly availableExercises = computed<string[]>(() => {
    const report = this.reportResult();
    if (!report) return [];
    if (report.analysisType === 'COMPARISON') {
      return (report.comparisonResults || [])
        .filter(c => c.resultA !== null && c.resultB !== null)
        .map(c => c.exerciseTitle);
    } else {
      return (report.exerciseTrends || [])
        .map(t => t.exerciseTitle);
    }
  });

  protected navigateExercise(direction: number): void {
    const exercises = this.availableExercises();
    if (exercises.length <= 1) return;
    
    const current = this.selectedExerciseForChart();
    const index = exercises.indexOf(current);
    if (index === -1) {
      this.selectedExerciseForChart.set(exercises[0]);
      return;
    }
    
    let nextIndex = index + direction;
    if (nextIndex < 0) {
      nextIndex = exercises.length - 1;
    } else if (nextIndex >= exercises.length) {
      nextIndex = 0;
    }
    
    this.selectedExerciseForChart.set(exercises[nextIndex]);
  }

  // Computed selector for BAR comparison chart
  protected readonly selectedComparison = computed(() => {
    const report = this.reportResult();
    const activeEx = this.selectedExerciseForChart();
    if (!report || report.analysisType !== 'COMPARISON' || !report.comparisonResults || !activeEx) {
      return null;
    }
    return report.comparisonResults.find(c => c.exerciseTitle === activeEx) || null;
  });

  // Computed selectors for LINE trend chart
  protected readonly selectedTrend = computed(() => {
    const report = this.reportResult();
    const activeEx = this.selectedExerciseForChart();
    if (!report || report.analysisType !== 'TREND' || !report.exerciseTrends || !activeEx) {
      return null;
    }
    return report.exerciseTrends.find(t => t.exerciseTitle === activeEx) || null;
  });

  protected readonly activeTrendPoints = computed<ChartDataPoint[]>(() => {
    const trend = this.selectedTrend();
    if (!trend || !trend.dataPoints) return [];
    return trend.dataPoints.map(dp => ({
      date: new Date(dp.date),
      result: dp.result
    }));
  });

  // Utility to find a test date from the original test history
  protected getTestDate(testId: string | undefined): Date | string | null {
    if (!testId) return null;
    const test = this.tests().find(t => t.id === testId);
    return test ? test.executionDate : null;
  }

  protected getTestDateFormatted(testId: string | undefined): string {
    if (!testId) return 'N/D';
    const test = this.tests().find(t => t.id === testId);
    if (!test || !test.executionDate) return 'N/D';
    return new Date(test.executionDate).toLocaleDateString('it-IT');
  }

  protected onExportPDF(): void {
    const report = this.reportResult();
    if (!report) return;

    this.isExportingPDF.set(true);

    setTimeout(async () => {
      try {
        await exportReportToPDF(
          report,
          this.athlete(),
          this.athleteId(),
          this.tests(),
          this.reportSummaryStats()
        );
      } catch (err) {
        console.error('Failed to generate PDF', err);
        this.toastService.error('Impossibile generare il PDF. Riprova più tardi.');
      } finally {
        this.isExportingPDF.set(false);
      }
    }, 150);
  }
}
