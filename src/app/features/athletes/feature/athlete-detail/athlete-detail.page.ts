import { ChangeDetectionStrategy, Component, inject, resource, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { TestsApiService } from '../../../tests/data-access/tests-api.service';
import { AthleteTestsListComponent } from '../../../tests/ui/athlete-tests-list/athlete-tests-list.component';
import { ReportDashboardComponent } from '../../../reports/feature/report-dashboard/report-dashboard.component';
import { SavedReportsListComponent } from '../../../reports/ui/saved-reports-list/saved-reports-list.component';
import { ReportResponse } from '../../../reports/data-access/reports.model';
import { DatePipe, NgClass } from '@angular/common';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-athlete-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, AthleteTestsListComponent, ReportDashboardComponent, SavedReportsListComponent, UiButtonComponent],
  templateUrl: './athlete-detail.page.html',
  styleUrl: './athlete-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  protected readonly activeSection = signal<'history' | 'reports' | 'saved-reports'>('history');
  protected readonly selectedSavedReport = signal<ReportResponse | null>(null);
  protected readonly autoOpenReportId = signal<string | null>(null);
  protected readonly avatarPreview = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'saved-reports') {
        this.activeSection.set('saved-reports');
      }
      if (params['reportId']) {
        this.autoOpenReportId.set(params['reportId']);
      }
    });
  }

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

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.avatarPreview.set(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  protected navigateTo(commands: unknown[]): void {
    this.router.navigate(commands);
  }

  protected closeSavedReport(): void {
    this.selectedSavedReport.set(null);
    this.autoOpenReportId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reportId: null },
      queryParamsHandling: 'merge'
    });
  }
}
