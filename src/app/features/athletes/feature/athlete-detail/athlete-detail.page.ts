import { ChangeDetectionStrategy, Component, inject, resource, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { TestsApiService } from '../../../tests/data-access/tests-api.service';
import { AthleteTestsListComponent } from '../../../tests/ui/athlete-tests-list/athlete-tests-list.component';
import { ReportDashboardComponent } from '../../../reports/feature/report-dashboard/report-dashboard.component';
import { SavedReportsListComponent } from '../../../reports/ui/saved-reports-list/saved-reports-list.component';
import { ReportResponse } from '../../../reports/data-access/reports.model';
import { DatePipe } from '@angular/common';
import { BreadcrumbService } from '../../../../shared/ui/breadcrumbs/breadcrumb.service';

@Component({
  selector: 'app-athlete-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, AthleteTestsListComponent, ReportDashboardComponent, SavedReportsListComponent],
  template: `
    <div class="page-container" [class.wide]="activeSection() !== 'history'">
      <header class="page-header">
        <button routerLink="/athletes" class="btn-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Torna all'elenco
        </button>

        @if (athleteResource.status() === 'resolved') {
          @let athlete = athleteResource.value()!;
          <div class="header-actions">
            <button [routerLink]="['/athletes', athlete.athleteId, 'tests', 'new']" class="btn-test">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Nuovo Test
            </button>
            <button [routerLink]="['/athletes', athlete.athleteId, 'edit']" class="btn-edit">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Modifica Dati
            </button>
          </div>
        }
      </header>

      @if (athleteResource.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento profilo atleta...</p>
        </div>
      } @else if (athleteResource.error()) {
        <div class="error-banner">
          <strong>Errore nel caricamento</strong>
          <p>Impossibile recuperare i dettagli dell'atleta. Riprova più tardi.</p>
          <button (click)="athleteResource.reload()" class="btn-retry">Riprova</button>
        </div>
      } @else if (athleteResource.value(); as athlete) {
        <article class="profile-card">
          <div class="profile-header">
            <div class="avatar-placeholder">
              {{ athlete.firstName[0] }}{{ athlete.lastName[0] }}
            </div>
            <div class="profile-info">
              <h1>{{ athlete.firstName }} {{ athlete.lastName }}</h1>
              <p class="id-tag">ID: {{ athlete.athleteId }}</p>
            </div>
          </div>

          <div class="profile-grid">
            <div class="info-group">
              <span class="label">Data di Nascita</span>
              <p>{{ athlete.birthDate | date:'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-group">
              <span class="label">Contatto di Riferimento</span>
              <p>{{ athlete.referenceContact || 'Non specificato' }}</p>
            </div>
            <div class="info-group">
              <span class="label">Data Registrazione</span>
              <p>{{ athlete.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          @if (athlete.medicalNotes) {
            <div class="notes-section">
              <span class="label">Note Mediche</span>
              <div class="notes-content">
                {{ athlete.medicalNotes }}
              </div>
            </div>
          }
        </article>

        <div class="section-tabs">
          <button 
            type="button" 
            class="section-tab-btn" 
            [class.active]="activeSection() === 'history'"
            (click)="activeSection.set('history')"
          >
            Storico Test
          </button>
          <button 
            type="button" 
            class="section-tab-btn" 
            [class.active]="activeSection() === 'reports'"
            (click)="activeSection.set('reports')"
          >
            Analisi & Confronti
          </button>
          <button 
            type="button" 
            class="section-tab-btn" 
            [class.active]="activeSection() === 'saved-reports'"
            (click)="activeSection.set('saved-reports'); selectedSavedReport.set(null)"
          >
            Report Salvati
          </button>
        </div>

        <section class="performance-section">
          @if (activeSection() === 'history') {
            @if (testsResource.isLoading()) {
              <div class="loading-state mini">
                <div class="spinner small"></div>
                <p>Caricamento storico test...</p>
              </div>
            } @else {
              <app-athlete-tests-list [tests]="testsResource.value() ?? []" />
            }
          } @else if (activeSection() === 'reports') {
            @if (testsResource.isLoading()) {
              <div class="loading-state mini">
                <div class="spinner small"></div>
                <p>Caricamento storico test...</p>
              </div>
            } @else {
              <app-report-dashboard 
                [athleteId]="athlete.athleteId" 
                [athlete]="athlete"
                [tests]="testsResource.value() ?? []"
                (reportSaved)="onReportSaved()"
              />
            }
          } @else {
            @if (testsResource.isLoading()) {
              <div class="loading-state mini">
                <div class="spinner small"></div>
                <p>Caricamento storico test...</p>
              </div>
            } @else {
              @if (selectedSavedReport(); as saved) {
                <div class="saved-report-viewer">
                  <button type="button" class="btn-back-to-list" (click)="selectedSavedReport.set(null)">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Torna all'elenco dei report salvati
                  </button>
                  <app-report-dashboard
                    [athleteId]="athlete.athleteId"
                    [athlete]="athlete"
                    [tests]="testsResource.value() ?? []"
                    [savedReport]="saved"
                  />
                </div>
              } @else {
                <app-saved-reports-list
                  #savedReportsList
                  [athleteId]="athlete.athleteId"
                  [tests]="testsResource.value() ?? []"
                  (viewReport)="selectedSavedReport.set($event)"
                />
              }
            }
          }
        </section>
      }
    </div>
  `,
  styles: `
    .page-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      transition: max-width 0.3s ease;
    }

    .page-container.wide {
      max-width: 1200px;
    }

    .page-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-back {
      background: none;
      border: none;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }

    .btn-back:hover {
      color: var(--color-primary-aka);
      background-color: #f1f5f9;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-test {
      background-color: var(--color-secondary-ao);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }

    .btn-test:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
    }

    .btn-edit {
      background-color: white;
      border: 1px solid #e2e8f0;
      color: var(--color-text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .btn-edit:hover {
      background-color: #f8fafc;
      border-color: var(--color-primary-aka);
      color: var(--color-primary-aka);
      transform: translateY(-1px);
    }

    .profile-card {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 2.5rem;
      border: 1px solid #f1f5f9;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .avatar-placeholder {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--color-primary-aka), var(--color-secondary-ao));
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 800;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
    }

    .profile-info h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin: 0;
    }

    .id-tag {
      color: var(--color-text-muted);
      font-family: monospace;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2.5rem;
    }

    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    .info-group p {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-main);
      margin: 0;
    }

    .notes-section .label {
      margin-bottom: 0.75rem;
    }

    .notes-content {
      background-color: #fef2f2;
      border-left: 4px solid var(--color-secondary-ao);
      padding: 1.5rem;
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
      color: #991b1b;
      font-style: italic;
      line-height: 1.6;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 0;
      gap: 1.5rem;
      color: var(--color-text-muted);
    }

    .loading-state.mini {
      padding: 2rem 0;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid var(--color-primary-aka);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner.small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      padding: 2rem;
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .btn-retry {
      margin-top: 1rem;
      background: white;
      border: 1px solid #fda4af;
      padding: 0.5rem 1.5rem;
      border-radius: var(--radius-lg);
      font-weight: 700;
      color: #9f1239;
      cursor: pointer;
    }

    .performance-section {
      margin-top: 1rem;
    }

    .section-tabs {
      display: flex;
      gap: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
    }

    .section-tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 0.25rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }

    .section-tab-btn:hover {
      color: var(--color-primary-aka);
    }

    .section-tab-btn.active {
      color: var(--color-primary-aka);
      border-bottom-color: var(--color-primary-aka);
    }

    .btn-back-to-list {
      background: none;
      border: 1px solid #cbd5e1;
      color: var(--color-text-main);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-lg);
      transition: all 0.2s;
      margin-bottom: 1.5rem;
      background-color: white;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .btn-back-to-list:hover {
      background-color: #f8fafc;
      border-color: var(--color-primary-aka);
      color: var(--color-primary-aka);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  protected readonly activeSection = signal<'history' | 'reports' | 'saved-reports'>('history');
  protected readonly selectedSavedReport = signal<ReportResponse | null>(null);

  protected readonly savedReportsList = viewChild<SavedReportsListComponent>('savedReportsList');

  protected readonly athleteResource = resource({
    loader: () => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) throw new Error('Athlete ID not found');
      return firstValueFrom(this.athletesApi.getAthlete(id)).then(athlete => {
        this.breadcrumbService.setLabel(id, `${athlete.firstName} ${athlete.lastName}`);
        return athlete;
      });
    },
  });

  protected readonly testsResource = resource({
    loader: () => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) throw new Error('Athlete ID not found');
      return firstValueFrom(this.testsApi.getTestsByAthlete(id));
    },
  });

  protected onReportSaved(): void {
    const list = this.savedReportsList();
    if (list) {
      list.reload();
    }
  }
}
