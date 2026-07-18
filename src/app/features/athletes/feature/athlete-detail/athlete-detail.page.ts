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
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';

@Component({
  selector: 'app-athlete-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, AthleteTestsListComponent, ReportDashboardComponent, SavedReportsListComponent],
  templateUrl: './athlete-detail.page.html',
  styleUrl: './athlete-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testsApi = inject(TestsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  protected readonly activeSection = signal<'history' | 'reports' | 'saved-reports'>('history');
  protected readonly selectedSavedReport = signal<ReportResponse | null>(null);
  protected readonly avatarPreview = signal<string | null>(null);

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
}
