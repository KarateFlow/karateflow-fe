import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteDetailPage } from './athlete-detail.page';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { TestsApiService } from '../../../tests/data-access/tests-api.service';
import { ReportsApiService } from '../../../reports/data-access/reports-api.service';
import { of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Athlete } from '../../data-access/athlete.model';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ReportPreviewResponse, ReportResponse } from '../../../reports/data-access/reports.model';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AthleteDetailPage', () => {
  let component: AthleteDetailPage;
  let fixture: ComponentFixture<AthleteDetailPage>;
  let mockAthletesApi: { getAthlete: Mock };
  let mockTestsApi: { getTestsByAthlete: Mock };
  let mockReportsApi: { getReportsByAthlete: Mock; generatePreview: Mock; saveReport: Mock };

  const mockAthlete: Athlete = {
    athleteId: '123',
    firstName: 'Mario',
    lastName: 'Rossi',
    birthDate: '1990-01-01',
    referenceContact: '3331234567',
    medicalNotes: 'Nessuna',
    createdAt: '2023-01-01T10:00:00Z',
  };

  const mockTests: TestResponse[] = [
    {
      id: 'test-1',
      athleteId: '123',
      executionDate: '2023-05-01',
      exercises: [],
      createdAt: '2023-05-01T10:00:00Z',
    }
  ];

  const mockReports: ReportResponse[] = [];

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of(mockAthlete)),
    };
    mockTestsApi = {
      getTestsByAthlete: vi.fn().mockReturnValue(of(mockTests)),
    };
    mockReportsApi = {
      getReportsByAthlete: vi.fn().mockReturnValue(of(mockReports)),
      generatePreview: vi.fn().mockReturnValue(of({} as ReportPreviewResponse)),
      saveReport: vi.fn().mockReturnValue(of({} as ReportResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [AthleteDetailPage],
      providers: [
        provideRouter([
          { path: 'athletes/:id', component: AthleteDetailPage }
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? '123' : null
              }
            },
            queryParams: of({})
          }
        },
        { provide: AthletesApiService, useValue: mockAthletesApi },
        { provide: TestsApiService, useValue: mockTestsApi },
        { provide: ReportsApiService, useValue: mockReportsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteDetailPage);
    component = fixture.componentInstance;
  });

  it('should create and load athlete and tests resources', async () => {
    expect(component).toBeTruthy();
    
    // Trigger resources load
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockAthletesApi.getAthlete).toHaveBeenCalledWith('123');
    expect(mockTestsApi.getTestsByAthlete).toHaveBeenCalledWith('123');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Mario Rossi');
  });

  it('should display error state and support retry for athleteResource', async () => {
    mockAthletesApi.getAthlete.mockReturnValue(timer(0).pipe(switchMap(() => throwError(() => new Error('API Error')))));
    
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['athleteResource'].error()).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bg-error-bg')).toBeTruthy();

    // Test retry
    expect(mockAthletesApi.getAthlete).toHaveBeenCalledTimes(1);
    mockAthletesApi.getAthlete.mockReturnValue(of(mockAthlete));
    component['athleteResource'].reload();
    
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 100));
    fixture.detectChanges();

    expect(mockAthletesApi.getAthlete).toHaveBeenCalledTimes(2);
  });

  it('should switch sections when tabs are clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['activeSection']()).toBe('history');

    // Select reports section
    component['activeSection'].set('reports');
    fixture.detectChanges();
    expect(component['activeSection']()).toBe('reports');

    // Select saved-reports section
    component['activeSection'].set('saved-reports');
    fixture.detectChanges();
    expect(component['activeSection']()).toBe('saved-reports');
  });

  it('should call reload on savedReportsList component when onReportSaved is called', () => {
    const mockList = {
      reload: vi.fn()
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(component as any, 'savedReportsList').mockReturnValue(mockList);

    component['onReportSaved']();
    expect(mockList.reload).toHaveBeenCalled();
  });
});
