import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { SavedReportsListComponent } from './saved-reports-list.component';
import { ReportsApiService } from '../../data-access/reports-api.service';
import { of } from 'rxjs';
import { ReportResponse } from '../../data-access/reports.model';
import { TestResponse } from '../../../tests/data-access/test.model';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('SavedReportsListComponent', () => {
  let component: SavedReportsListComponent;
  let fixture: ComponentFixture<SavedReportsListComponent>;
  let reportsApiServiceMock: {
    getReportsByAthlete: ReturnType<typeof vi.fn>;
    deleteReport: ReturnType<typeof vi.fn>;
  };

  const mockReports: ReportResponse[] = [
    {
      reportId: 'report-111',
      athleteId: 'athlete-123',
      createdAt: '2026-06-25T12:00:00Z',
      testIds: ['test-A', 'test-B'],
      payload: {
        athleteId: 'athlete-123',
        analysisType: 'COMPARISON',
        testIdA: 'test-A',
        testIdB: 'test-B',
        comparisonResults: [],
      },
    },
  ];

  const mockTests: TestResponse[] = [
    {
      id: 'test-A',
      athleteId: 'athlete-123',
      executionDate: '2026-06-20T10:00:00Z',
      type: 'Standard',
      coachNotes: 'None',
      exercises: [],
      createdAt: '2026-06-20T10:00:00Z',
    },
    {
      id: 'test-B',
      athleteId: 'athlete-123',
      executionDate: '2026-06-25T10:00:00Z',
      type: 'Standard',
      coachNotes: 'None',
      exercises: [],
      createdAt: '2026-06-25T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    reportsApiServiceMock = {
      getReportsByAthlete: vi.fn().mockReturnValue(of(mockReports)),
      deleteReport: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SavedReportsListComponent],
      providers: [
        { provide: ReportsApiService, useValue: reportsApiServiceMock },
      ],
    }).compileComponents();
  });

  const setupComponent = async (athleteId: string, tests: TestResponse[]) => {
    fixture = TestBed.createComponent(SavedReportsListComponent);
    component = fixture.componentInstance;
    
    // Set inputs using signal setters or input properties
    fixture.componentRef.setInput('athleteId', athleteId);
    fixture.componentRef.setInput('tests', tests);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable(); // Attendi che la risorsa termini
    fixture.detectChanges();
  };

  it('should create and load saved reports', async () => {
    await setupComponent('athlete-123', mockTests);
    expect(component).toBeTruthy();
    expect(reportsApiServiceMock.getReportsByAthlete).toHaveBeenCalledWith('athlete-123');
  });

  it('should emit viewReport when Visualizza is clicked', async () => {
    await setupComponent('athlete-123', mockTests);
    
    const spyEmit = vi.spyOn(component.viewReport, 'emit');
    
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const viewBtn = Array.from(buttons).find(b => b.textContent?.includes('Visualizza')) as HTMLElement;
    expect(viewBtn).toBeTruthy();
    viewBtn.click();
    
    expect(spyEmit).toHaveBeenCalledWith(mockReports[0]);
  });

  it('should call deleteReport when Delete is clicked and confirm is true', async () => {
    await setupComponent('athlete-123', mockTests);
    
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const deleteBtn = Array.from(buttons).find(b => b.textContent?.includes('Elimina')) as HTMLElement;
    expect(deleteBtn).toBeTruthy();
    deleteBtn.click();
    
    fixture.detectChanges();
    
    component['onConfirmDelete']();
    
    expect(reportsApiServiceMock.deleteReport).toHaveBeenCalledWith('report-111');
  });
});
