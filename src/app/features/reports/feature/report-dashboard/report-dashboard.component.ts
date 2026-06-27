import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ReportsApiService } from '../../data-access/reports-api.service';
import { ReportPreviewResponse, ReportResponse } from '../../data-access/reports.model';
import { ChartDataPoint, ReportChartComponent } from '../../ui/report-chart/report-chart.component';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, ReportChartComponent],
  template: `
    <div class="dashboard-wrapper">
      @if (savedReport(); as saved) {
        <div class="saved-report-header">
          <div class="header-info">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>
              Report storico salvato il <strong>{{ saved.createdAt | date:'dd/MM/yyyy HH:mm' }}</strong>
            </span>
          </div>
          <span class="report-type-badge">
            {{ saved.payload.analysisType === 'COMPARISON' ? 'Confronto A vs B' : 'Trend Temporale' }}
          </span>
        </div>
      } @else {
        <div class="control-panel">
          <div class="tabs-navigation">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="analysisType() === 'COMPARISON'" 
              (click)="setAnalysisType('COMPARISON')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Confronto A vs B
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="analysisType() === 'TREND'" 
              (click)="setAnalysisType('TREND')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Trend Temporale
            </button>
          </div>

          <div class="form-container">
            @if (analysisType() === 'COMPARISON') {
              <div class="comparison-selectors">
                <div class="form-group">
                  <label class="input-label" for="testIdASelect">Test Baseline (Meno recente / A)</label>
                  <select id="testIdASelect" [ngModel]="testIdA()" (ngModelChange)="testIdA.set($event)" class="form-select">
                    <option value="">-- Seleziona Test A --</option>
                    @for (test of tests(); track test.id) {
                      <option [value]="test.id">
                        {{ test.executionDate | date:'dd/MM/yyyy HH:mm' }} - {{ test.type || 'Sessione Standard' }} ({{ test.exercises.length }} es)
                      </option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="input-label" for="testIdBSelect">Test di Confronto (Più recente / B)</label>
                  <select id="testIdBSelect" [ngModel]="testIdB()" (ngModelChange)="testIdB.set($event)" class="form-select">
                    <option value="">-- Seleziona Test B --</option>
                    @for (test of tests(); track test.id) {
                      <option [value]="test.id" [disabled]="test.id === testIdA()">
                        {{ test.executionDate | date:'dd/MM/yyyy HH:mm' }} - {{ test.type || 'Sessione Standard' }} ({{ test.exercises.length }} es)
                      </option>
                    }
                  </select>
                </div>

                <button 
                  type="button" 
                  class="btn-submit" 
                  [disabled]="isLoading() || !testIdA() || !testIdB()" 
                  (click)="onGenerate()"
                >
                  Genera Confronto
                </button>
              </div>
            } @else {
              <div class="trend-selectors">
                <div class="form-group">
                  <label class="input-label" for="startDateInput">Data Inizio (Opzionale)</label>
                  <input id="startDateInput" type="date" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="input-label" for="endDateInput">Data Fine (Opzionale)</label>
                  <input id="endDateInput" type="date" [ngModel]="endDate()" (ngModelChange)="endDate.set($event)" class="form-input" />
                </div>

                <button 
                  type="button" 
                  class="btn-submit" 
                  [disabled]="isLoading()" 
                  (click)="onGenerate()"
                >
                  Genera Trend Storico
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- State Visualizers -->
      @if (isLoading()) {
        <div class="loader-wrapper">
          <div class="spinner"></div>
          <p>Generazione dell'anteprima in corso...</p>
        </div>
      }

      @if (errorMsg(); as error) {
        <div class="error-panel">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Errore di Generazione</strong>
            <p>{{ error }}</p>
          </div>
        </div>
      }

      <!-- Report Results Display -->
      @if (reportResult(); as report) {
        <div class="report-content">
          <div class="report-header-actions">
            <h2 class="report-title">
              {{ report.analysisType === 'COMPARISON' ? 'Report di Confronto' : 'Report di Trend' }}
            </h2>
            <div class="actions-group">
              @if (!savedReport() && !reportIsSaved() && !isSaving()) {
                <button type="button" class="btn-save-report" (click)="onSaveReport()">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Salva Report
                </button>
              } @else if (isSaving()) {
                <span class="saving-loader">
                  <div class="spinner small"></div>
                  Salvataggio in corso...
                </span>
              } @else if (savedReport() || reportIsSaved()) {
                <span class="badge-saved">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Report Salvato
                </span>
              }
            </div>
          </div>
          <!-- Riepilogo di Confronto -->
          @if (reportSummaryStats(); as stats) {
            <div class="summary-panel">
              <div class="summary-card overall-card" [class.positive]="stats.overallImprovement >= 0" [class.negative]="stats.overallImprovement < 0">
                <div class="overall-label">Miglioramento Complessivo</div>
                <div class="overall-value">
                  {{ stats.overallImprovement >= 0 ? '+' : '' }}{{ stats.overallImprovement | number:'1.1-2' }}%
                </div>
                <div class="overall-subtitle">Media variazioni degli esercizi confrontabili</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-item item-improved">
                  <div class="stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Migliorati</span>
                    <span class="stat-count">{{ stats.improved }}</span>
                  </div>
                </div>
                
                <div class="stat-item item-worsened">
                  <div class="stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                      <polyline points="17 18 23 18 23 12"></polyline>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Peggiorati</span>
                    <span class="stat-count">{{ stats.worsened }}</span>
                  </div>
                </div>
                
                <div class="stat-item item-stable">
                  <div class="stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Rimasti Uguali</span>
                    <span class="stat-count">{{ stats.stable }}</span>
                  </div>
                </div>
                
                <div class="stat-item item-na">
                  <div class="stat-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Non Conf. (N/A)</span>
                    <span class="stat-count">{{ stats.na }}</span>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (report.analysisType === 'COMPARISON') {
            <!-- OVERLAP WARNING IF APPLICABLE -->
            @if (report.lowOverlap) {
              <div class="warning-banner">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div>
                  <strong>Copertura Esercizi Bassa ({{ report.overlapPercentage | number:'1.0-1' }}%)</strong>
                  <p>I due test selezionati hanno meno del 30% di esercizi in comune. Molti dati potrebbero risultare non confrontabili.</p>
                </div>
              </div>
            }

            <!-- COMPARISON VISUALS -->
            <div class="report-grid">
              <!-- CHART FIRST (TOP) -->
              <div class="chart-panel">
                @if (selectedComparison(); as activeComp) {
                  <div class="chart-header-row">
                    <div class="section-title">Grafico di Confronto</div>
                    <div class="chart-navigation">
                      <button 
                        type="button" 
                        class="nav-arrow-btn" 
                        (click)="navigateExercise(-1)" 
                        [disabled]="availableExercises().length <= 1"
                        aria-label="Esercizio precedente"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <span class="active-exercise-name">{{ selectedExerciseForChart() }}</span>
                      <button 
                        type="button" 
                        class="nav-arrow-btn" 
                        (click)="navigateExercise(1)" 
                        [disabled]="availableExercises().length <= 1"
                        aria-label="Esercizio successivo"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <app-report-chart
                    chartType="bar"
                    [resultA]="activeComp.resultA"
                    [resultB]="activeComp.resultB"
                    [dateA]="getTestDate(report.testIdA)"
                    [dateB]="getTestDate(report.testIdB)"
                    [delta]="activeComp.delta"
                    [percentageChange]="activeComp.percentageChange"
                    [unit]="activeComp.unit.toLowerCase()"
                    [greaterIsBetter]="activeComp.greaterIsBetter"
                  />
                } @else {
                  <div class="chart-placeholder">
                    Nessun esercizio confrontabile disponibile nei test selezionati.
                  </div>
                }
              </div>

              <!-- TABLE SECOND (BOTTOM) -->
              <div class="table-container">
                <div class="section-title">Risultati degli Esercizi <span class="subtitle">(Clicca su una riga per visualizzare il relativo grafico sopra)</span></div>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th class="text-left">Esercizio</th>
                      <th class="text-right">Test A</th>
                      <th class="text-right">Test B</th>
                      <th class="text-right">Delta</th>
                      <th class="text-right">Variazione %</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (comp of report.comparisonResults; track comp.exerciseTitle) {
                      <tr 
                        [class.selected]="selectedExerciseForChart() === comp.exerciseTitle"
                        [class.disabled-row]="comp.resultA === null || comp.resultB === null"
                        class="clickable-row"
                        (click)="comp.resultA !== null && comp.resultB !== null ? selectedExerciseForChart.set(comp.exerciseTitle) : null"
                      >
                        <td class="font-bold text-left">
                          {{ comp.exerciseTitle }}
                        </td>
                        <td class="text-right">
                          {{ comp.resultA !== null ? (comp.resultA | number:'1.0-2') : '-' }} 
                          <span class="unit">{{ comp.resultA !== null ? comp.unit.toLowerCase() : '' }}</span>
                        </td>
                        <td class="text-right">
                          {{ comp.resultB !== null ? (comp.resultB | number:'1.0-2') : '-' }} 
                          <span class="unit">{{ comp.resultB !== null ? comp.unit.toLowerCase() : '' }}</span>
                        </td>
                        <td class="text-right font-mono font-bold" [class.val-pos]="isPositive(comp.delta, comp.greaterIsBetter)" [class.val-neg]="isNegative(comp.delta, comp.greaterIsBetter)">
                          {{ formatDeltaSign(comp.delta) }}
                          @if (comp.delta !== 'N/A') {
                            <span class="unit">{{ comp.unit.toLowerCase() }}</span>
                          }
                        </td>
                        <td class="text-right font-mono font-bold" [class.val-pos]="isPositive(comp.delta, comp.greaterIsBetter)" [class.val-neg]="isNegative(comp.delta, comp.greaterIsBetter)">
                          {{ formatPctSign(comp.percentageChange) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <!-- TREND VISUALS -->
            <div class="report-grid">
              <!-- CHART FIRST (TOP) -->
              <div class="chart-panel">
                @if (selectedTrend(); as activeTrend) {
                  <div class="chart-header-row">
                    <div class="section-title">Trend Storico</div>
                    <div class="chart-navigation">
                      <button 
                        type="button" 
                        class="nav-arrow-btn" 
                        (click)="navigateExercise(-1)" 
                        [disabled]="availableExercises().length <= 1"
                        aria-label="Esercizio precedente"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <span class="active-exercise-name">{{ selectedExerciseForChart() }}</span>
                      <button 
                        type="button" 
                        class="nav-arrow-btn" 
                        (click)="navigateExercise(1)" 
                        [disabled]="availableExercises().length <= 1"
                        aria-label="Esercizio successivo"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <app-report-chart
                    chartType="line"
                    [linePoints]="activeTrendPoints()"
                  />
                  
                  <div class="table-container inline-table">
                    <div class="section-title mini">Rilevazioni</div>
                    <table class="report-table">
                      <thead>
                        <tr>
                          <th class="text-left">Data Rilevazione</th>
                          <th class="text-right">Risultato</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (dp of activeTrend.dataPoints; track $index) {
                          <tr>
                            <td class="text-left">{{ dp.date | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="text-right font-bold text-primary">
                              {{ dp.result | number:'1.0-2' }} <span class="unit">{{ activeTrend.unit.toLowerCase() }}</span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="chart-placeholder">
                    Nessun esercizio selezionato o dati non presenti nel periodo indicato.
                  </div>
                }
              </div>

              <!-- SELECTOR SECOND (BOTTOM) -->
              <div class="sidebar-selector">
                <div class="section-title">Esercizi Disponibili <span class="subtitle">(Clicca su una card per visualizzare il relativo grafico sopra)</span></div>
                <div class="exercise-selector-grid">
                  @for (trend of report.exerciseTrends; track trend.exerciseTitle) {
                    <button 
                      type="button" 
                      class="trend-select-card"
                      [class.active]="selectedExerciseForChart() === trend.exerciseTitle"
                      (click)="selectedExerciseForChart.set(trend.exerciseTitle)"
                    >
                      <div class="trend-card-header">
                        <span class="font-bold">{{ trend.exerciseTitle }}</span>
                        <span class="badge">{{ trend.dataPoints.length }} rilev.</span>
                      </div>
                      <div class="trend-card-meta text-muted text-xs">
                        Tendenza: {{ trend.greaterIsBetter ? 'Alto è meglio' : 'Basso è meglio' }} ({{ trend.unit.toLowerCase() }})
                      </div>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (!isLoading()) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>Configura i parametri del report sopra e clicca su "Genera" per visualizzare l'analisi delle performance.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .dashboard-wrapper {
      margin-top: 1.5rem;
    }

    .control-panel {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }

    .tabs-navigation {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--color-text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: var(--radius-lg);
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background-color: #f1f5f9;
      color: var(--color-text-main);
    }

    .tab-btn.active {
      color: var(--color-primary-aka);
      background-color: #eff6ff;
    }

    .form-container {
      padding-top: 0.25rem;
    }

    .comparison-selectors,
    .trend-selectors {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-end;
    }

    .form-group {
      flex: 1;
      min-width: 240px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .form-select,
    .form-input {
      padding: 0.625rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-lg);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      color: var(--color-text-main);
      background-color: white;
      outline: none;
      transition: all 0.2s;
      width: 100%;
    }

    .form-select:focus,
    .form-input:focus {
      border-color: var(--color-primary-aka);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .btn-submit {
      background-color: var(--color-primary-aka);
      color: white;
      border: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.65rem 1.5rem;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15);
      height: 42px;
      white-space: nowrap;
    }

    .btn-submit:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .btn-submit:disabled {
      background-color: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Loader, errors */
    .loader-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 0;
      gap: 1rem;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-panel {
      background-color: #fef2f2;
      border: 1px solid #fecdd3;
      color: #991b1b;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-xl);
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .error-panel svg {
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .error-panel strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }

    .error-panel p {
      font-size: 0.875rem;
      margin: 0;
    }

    /* Warning banner */
    .warning-banner {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-xl);
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .warning-banner svg {
      flex-shrink: 0;
      color: #d97706;
    }

    .warning-banner strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .warning-banner p {
      font-size: 0.875rem;
      margin: 0;
    }

    /* Layout structure (stacked vertically as requested) */
    .report-content {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Summary Panel Styles */
    .summary-panel {
      display: grid;
      grid-template-columns: 1.2fr 3fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .summary-panel {
        grid-template-columns: 1fr;
      }
    }

    .overall-card {
      background: white;
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .overall-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
    }

    .overall-card.positive {
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border-color: #bbf7d0;
    }
    .overall-card.positive::before {
      background: #22c55e;
    }
    .overall-card.positive .overall-value {
      color: #15803d;
    }

    .overall-card.negative {
      background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
      border-color: #fecdd3;
    }
    .overall-card.negative::before {
      background: #ef4444;
    }
    .overall-card.negative .overall-value {
      color: #b91c1c;
    }

    .overall-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin-bottom: 0.25rem;
    }

    .overall-value {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.1;
      margin: 0.25rem 0;
    }

    .overall-subtitle {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-item {
      background: white;
      border-radius: var(--radius-xl);
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .stat-count {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      line-height: 1.2;
    }

    .item-improved .stat-icon {
      background-color: #f0fdf4;
      color: #22c55e;
    }
    .item-worsened .stat-icon {
      background-color: #fef2f2;
      color: #ef4444;
    }
    .item-stable .stat-icon {
      background-color: #f8fafc;
      color: #64748b;
    }
    .item-na .stat-icon {
      background-color: #f1f5f9;
      color: #94a3b8;
    }

    .report-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      align-items: start;
    }

    .table-container {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 800;
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      color: var(--color-text-main);
      border-bottom: 1px solid #e2e8f0;
    }

    .subtitle {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-text-muted);
      margin-left: 0.5rem;
    }

    .section-title.mini {
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .report-table th {
      background: #f8fafc;
      text-align: left;
      padding: 0.85rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      border-bottom: 1px solid #e2e8f0;
    }

    .report-table td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .report-table tr:last-child td {
      border-bottom: none;
    }

    /* Clickable rows styling */
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .clickable-row:hover:not(.disabled-row) {
      background-color: #f8fafc;
    }

    .clickable-row.selected {
      background-color: #eff6ff;
    }

    .clickable-row.disabled-row {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .font-bold { font-weight: 700; color: var(--color-text-main); }
    .block { display: block; }
    .unit { color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500; margin-left: 0.2rem; }

    .val-pos {
      color: #16a34a;
    }

    .val-neg {
      color: #dc2626;
    }

    /* Chart Navigation controls with arrows */
    .chart-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding-right: 1.5rem;
      border-top-left-radius: var(--radius-xl);
      border-top-right-radius: var(--radius-xl);
    }

    .chart-header-row .section-title {
      border-bottom: none;
      background: none;
    }

    .chart-navigation {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md);
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .nav-arrow-btn {
      background: none;
      border: none;
      color: var(--color-text-main);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }

    .nav-arrow-btn:hover:not(:disabled) {
      background-color: #f1f5f9;
      color: var(--color-primary-aka);
    }

    .nav-arrow-btn:disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }

    .active-exercise-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-main);
      min-width: 140px;
      text-align: center;
      white-space: nowrap;
    }

    .chart-panel {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    /* Sidebar selector as bottom grid */
    .sidebar-selector {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      padding-bottom: 1.5rem;
    }

    .exercise-selector-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
    }

    .trend-select-card {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-lg);
      width: 100%;
      text-align: left;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .trend-select-card:hover {
      border-color: var(--color-primary-aka);
      background-color: #f8fafc;
    }

    .trend-select-card.active {
      background-color: #eff6ff;
      border-color: var(--color-primary-aka);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
    }

    .trend-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .badge {
      background: #e2e8f0;
      color: var(--color-text-muted);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 700;
    }

    .trend-select-card.active .badge {
      background: #dbeafe;
      color: var(--color-primary-aka);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border: 2px dashed #cbd5e1;
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
      margin-top: 1rem;
    }

    .empty-state svg {
      margin-bottom: 1rem;
      opacity: 0.3;
      color: var(--color-text-muted);
    }

    .empty-state p {
      max-width: 400px;
      margin: 0 auto;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .chart-placeholder {
      height: 250px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--color-text-muted);
      padding: 2rem;
      font-style: italic;
    }

    .inline-table {
      margin: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid #e2e8f0;
    }

    .report-header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .report-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin: 0;
    }

    .actions-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-save-report {
      background-color: var(--color-primary-aka);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-save-report:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .saving-loader {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .badge-saved {
      background-color: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .saved-report-header {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-xl);
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .saved-report-header .header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #1e3a8a;
    }

    .report-type-badge {
      background-color: #3b82f6;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .text-primary {
      color: var(--color-primary-aka);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDashboardComponent {
  athleteId = input.required<string>();
  tests = input.required<TestResponse[]>();
  savedReport = input<ReportResponse | null>(null);

  reportSaved = output<void>();

  private readonly reportsApi = inject(ReportsApiService);

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

  protected readonly reportSummaryStats = computed(() => {
    const report = this.reportResult();
    if (!report) return null;

    let improved = 0;
    let worsened = 0;
    let stable = 0;
    let na = 0;
    let weightedImprovementSum = 0;
    let totalWeight = 0;
    let hasValidData = false;

    if (report.analysisType === 'COMPARISON') {
      const items = report.comparisonResults || [];
      items.forEach(c => {
        if (c.resultA === null || c.resultB === null || c.delta === 'N/A') {
          na++;
        } else {
          const deltaVal = parseFloat(c.delta);
          const pctVal = parseFloat(c.percentageChange);
          if (isNaN(deltaVal) || isNaN(pctVal)) {
            na++;
            return;
          }

          if (deltaVal === 0) {
            stable++;
          } else {
            const isImp = c.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
            if (isImp) {
              improved++;
            } else {
              worsened++;
            }
          }
          
          const impPct = c.greaterIsBetter ? pctVal : -pctVal;
          const weight = c.resultA;
          weightedImprovementSum += (weight * impPct);
          totalWeight += weight;
          hasValidData = true;
        }
      });
    } else {
      const trends = report.exerciseTrends || [];
      trends.forEach(t => {
        const pts = t.dataPoints || [];
        if (pts.length < 2) {
          na++;
        } else {
          const firstVal = pts[0].result;
          const lastVal = pts[pts.length - 1].result;
          const deltaVal = lastVal - firstVal;
          
          if (deltaVal === 0) {
            stable++;
          } else {
            const isImp = t.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
            if (isImp) {
              improved++;
            } else {
              worsened++;
            }
          }

          const pctVal = firstVal !== 0 ? (deltaVal / firstVal) * 100 : 0;
          const impPct = t.greaterIsBetter ? pctVal : -pctVal;
          const weight = firstVal;
          weightedImprovementSum += (weight * impPct);
          totalWeight += weight;
          hasValidData = true;
        }
      });
    }

    const overallImprovement = totalWeight > 0 ? (weightedImprovementSum / totalWeight) : 0;

    return {
      improved,
      worsened,
      stable,
      na,
      overallImprovement,
      hasValidData
    };
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

    this.reportsApi.saveReport(requestPayload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.reportIsSaved.set(true);
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

    this.reportsApi.generatePreview(requestPayload).subscribe({
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

  // Delta color helpers
  protected isPositive(deltaStr: string, greaterIsBetter: boolean): boolean {
    if (deltaStr === 'N/A') return false;
    const val = parseFloat(deltaStr);
    return greaterIsBetter ? val > 0 : val < 0;
  }

  protected isNegative(deltaStr: string, greaterIsBetter: boolean): boolean {
    if (deltaStr === 'N/A') return false;
    const val = parseFloat(deltaStr);
    return greaterIsBetter ? val < 0 : val > 0;
  }

  protected formatDeltaSign(deltaStr: string): string {
    if (deltaStr === 'N/A') return 'N/A';
    const val = parseFloat(deltaStr);
    if (isNaN(val)) return deltaStr;
    return val > 0 ? `+${deltaStr}` : deltaStr;
  }

  protected formatPctSign(pctStr: string): string {
    if (pctStr === 'N/A') return 'N/A';
    const val = parseFloat(pctStr);
    if (isNaN(val)) return pctStr;
    return val > 0 ? `+${pctStr}%` : `${pctStr}%`;
  }
}
