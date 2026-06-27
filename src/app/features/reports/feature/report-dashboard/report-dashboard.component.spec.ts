import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ReportDashboardComponent } from './report-dashboard.component';
import { ReportsApiService } from '../../data-access/reports-api.service';
import { of, Observable } from 'rxjs';
import { TestResponse } from '../../../tests/data-access/test.model';
import { ReportPreviewResponse, ReportResponse } from '../../data-access/reports.model';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('ReportDashboardComponent', () => {
  let reportsApiServiceMock: {
    generatePreview: ReturnType<typeof vi.fn>;
    saveReport: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    reportsApiServiceMock = {
      generatePreview: vi.fn(),
      saveReport: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReportDashboardComponent],
      providers: [
        { provide: ReportsApiService, useValue: reportsApiServiceMock },
      ],
    });
  });

  const mockTests: TestResponse[] = [
    {
      id: 'test-newest',
      athleteId: 'athlete-123',
      executionDate: '2026-06-25T10:00:00Z',
      type: 'Standard',
      coachNotes: 'None',
      exercises: [],
      createdAt: '2026-06-25T10:00:00Z',
    },
    {
      id: 'test-oldest',
      athleteId: 'athlete-123',
      executionDate: '2026-06-20T10:00:00Z',
      type: 'Standard',
      coachNotes: 'None',
      exercises: [],
      createdAt: '2026-06-20T10:00:00Z',
    },
  ];

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should auto-select default tests on init based on signals', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);

    fixture.detectChanges();

    // The oldest test is mockTests[1] (test-oldest) because mockTests is ordered newest first.
    // The newest test is mockTests[0] (test-newest).
    expect(component['testIdA']()).toBe('test-oldest');
    expect(component['testIdB']()).toBe('test-newest');
  });

  it('should call generatePreview api when onGenerate is called for comparison', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);

    fixture.detectChanges();

    const mockResponse: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'COMPARISON',
      lowOverlap: false,
      comparisonResults: [
        {
          exerciseTitle: 'Pushups',
          resultA: 10.0,
          resultB: 15.0,
          delta: '5.00',
          percentageChange: '50.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
      ],
    };

    reportsApiServiceMock.generatePreview.mockReturnValue(of(mockResponse));

    component['testIdA'].set('test-oldest');
    component['testIdB'].set('test-newest');
    component['onGenerate']();

    expect(reportsApiServiceMock.generatePreview).toHaveBeenCalledWith({
      analysisType: 'COMPARISON',
      athleteId: 'athlete-123',
      testIdA: 'test-oldest',
      testIdB: 'test-newest',
      startDate: undefined,
      endDate: undefined,
    });

    expect(component['reportResult']()).toEqual(mockResponse);
    expect(component['selectedExerciseForChart']()).toBe('Pushups');
  });

  it('should navigate between exercises correctly', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockResponse: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'COMPARISON',
      lowOverlap: false,
      comparisonResults: [
        {
          exerciseTitle: 'Pushups',
          resultA: 10.0,
          resultB: 15.0,
          delta: '5.00',
          percentageChange: '50.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
        {
          exerciseTitle: 'Squats',
          resultA: 20.0,
          resultB: 30.0,
          delta: '10.00',
          percentageChange: '50.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
      ],
    };

    reportsApiServiceMock.generatePreview.mockReturnValue(of(mockResponse));
    component['onGenerate']();

    // Default active should be first chartable (Pushups)
    expect(component['selectedExerciseForChart']()).toBe('Pushups');

    // Go next (1) -> should be Squats
    component['navigateExercise'](1);
    expect(component['selectedExerciseForChart']()).toBe('Squats');

    // Go next (1) again -> should wrap around to Pushups
    component['navigateExercise'](1);
    expect(component['selectedExerciseForChart']()).toBe('Pushups');

    // Go prev (-1) -> should wrap around to Squats
    component['navigateExercise'](-1);
    expect(component['selectedExerciseForChart']()).toBe('Squats');
  });

  it('should compute reportSummaryStats correctly for COMPARISON', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockResponse: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'COMPARISON',
      comparisonResults: [
        {
          exerciseTitle: 'Pushups', // Improved
          resultA: 10.0,
          resultB: 15.0,
          delta: '5.00',
          percentageChange: '50.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
        {
          exerciseTitle: 'Run 100m', // Improved (lower time is better)
          resultA: 12.0,
          resultB: 11.0,
          delta: '-1.00',
          percentageChange: '-8.33',
          unit: 'SEC',
          greaterIsBetter: false,
        },
        {
          exerciseTitle: 'Squats', // Stable
          resultA: 20.0,
          resultB: 20.0,
          delta: '0.00',
          percentageChange: '0.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
        {
          exerciseTitle: 'Pullups', // Worsened
          resultA: 10.0,
          resultB: 8.0,
          delta: '-2.00',
          percentageChange: '-20.00',
          unit: 'COUNT',
          greaterIsBetter: true,
        },
        {
          exerciseTitle: 'Plank', // N/A
          resultA: null,
          resultB: 120.0,
          delta: 'N/A',
          percentageChange: 'N/A',
          unit: 'SEC',
          greaterIsBetter: true,
        },
      ],
    };

    reportsApiServiceMock.generatePreview.mockReturnValue(of(mockResponse));
    component['onGenerate']();

    const stats = component['reportSummaryStats']();
    expect(stats).toBeTruthy();
    expect(stats?.improved).toBe(2);
    expect(stats?.worsened).toBe(1);
    expect(stats?.stable).toBe(1);
    expect(stats?.na).toBe(1);
    // Overall improvement weighted formula check:
    // Pushups: resultA = 10, impPct = +50% -> weighted = 500
    // Run 100m: resultA = 12, impPct = +8.333% -> weighted = 100
    // Squats: resultA = 20, impPct = 0% -> weighted = 0
    // Pullups: resultA = 10, impPct = -20% -> weighted = -200
    // Weighted Sum = 500 + 99.96 + 0 - 200 = 399.96
    // Total Weight = 10 + 12 + 20 + 10 = 52
    // Average = 399.96 / 52 = 7.6915%
    expect(stats?.overallImprovement).toBeCloseTo(7.6915, 3);
  });

  it('should switch analysis type and clear results', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    component['reportResult'].set({} as ReportPreviewResponse);
    component['errorMsg'].set('Some error');
    component['selectedExerciseForChart'].set('Squats');

    component['setAnalysisType']('TREND');

    expect(component['analysisType']()).toBe('TREND');
    expect(component['reportResult']()).toBeNull();
    expect(component['errorMsg']()).toBeNull();
    expect(component['selectedExerciseForChart']()).toBe('');
  });

  it('should call generatePreview api when onGenerate is called for trend', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockResponse: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'TREND',
      startDate: '2026-06-20T10:00:00Z',
      endDate: '2026-06-25T10:00:00Z',
      exerciseTrends: [
        {
          exerciseTitle: 'Pushups',
          unit: 'COUNT',
          greaterIsBetter: true,
          dataPoints: [
            { date: '2026-06-20T10:00:00Z', result: 10.0 },
            { date: '2026-06-25T10:00:00Z', result: 15.0 },
          ],
        },
      ],
    };

    reportsApiServiceMock.generatePreview.mockReturnValue(of(mockResponse));

    component['analysisType'].set('TREND');
    component['startDate'].set('2026-06-20');
    component['endDate'].set('2026-06-25');
    component['onGenerate']();

    expect(reportsApiServiceMock.generatePreview).toHaveBeenCalledWith({
      analysisType: 'TREND',
      athleteId: 'athlete-123',
      testIdA: undefined,
      testIdB: undefined,
      startDate: new Date('2026-06-20').toISOString(),
      endDate: new Date('2026-06-25').toISOString(),
    });

    expect(component['reportResult']()).toEqual(mockResponse);
    expect(component['selectedExerciseForChart']()).toBe('Pushups');
  });

  it('should handle api error on generatePreview', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockError = { error: { message: 'Failed to fetch' } };
    reportsApiServiceMock.generatePreview.mockReturnValue(
      new Observable(observer => observer.error(mockError))
    );

    component['onGenerate']();

    expect(component['isLoading']()).toBe(false);
    expect(component['errorMsg']()).toBe('Failed to fetch');
  });

  it('should compute reportSummaryStats correctly for TREND', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockResponse: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'TREND',
      exerciseTrends: [
        {
          exerciseTitle: 'Pushups', // Improved (10 -> 15)
          unit: 'COUNT',
          greaterIsBetter: true,
          dataPoints: [
            { date: '2026-06-20T10:00:00Z', result: 10.0 },
            { date: '2026-06-25T10:00:00Z', result: 15.0 },
          ],
        },
        {
          exerciseTitle: 'Squats', // Stable (20 -> 20)
          unit: 'COUNT',
          greaterIsBetter: true,
          dataPoints: [
            { date: '2026-06-20T10:00:00Z', result: 20.0 },
            { date: '2026-06-25T10:00:00Z', result: 20.0 },
          ],
        },
        {
          exerciseTitle: 'Pullups', // Worsened (10 -> 8)
          unit: 'COUNT',
          greaterIsBetter: true,
          dataPoints: [
            { date: '2026-06-20T10:00:00Z', result: 10.0 },
            { date: '2026-06-25T10:00:00Z', result: 8.0 },
          ],
        },
        {
          exerciseTitle: 'Plank', // N/A (only 1 data point)
          unit: 'SEC',
          greaterIsBetter: true,
          dataPoints: [
            { date: '2026-06-25T10:00:00Z', result: 120.0 },
          ],
        },
      ],
    };

    reportsApiServiceMock.generatePreview.mockReturnValue(of(mockResponse));
    component['analysisType'].set('TREND');
    component['onGenerate']();

    const stats = component['reportSummaryStats']();
    expect(stats).toBeTruthy();
    expect(stats?.improved).toBe(1);
    expect(stats?.worsened).toBe(1);
    expect(stats?.stable).toBe(1);
    expect(stats?.na).toBe(1);
    // Pushups: baseline = 10, impPct = +50% -> weighted = 500
    // Squats: baseline = 20, impPct = 0% -> weighted = 0
    // Pullups: baseline = 10, impPct = -20% -> weighted = -200
    // Weighted Sum = 300
    // Total Weight = 10 + 20 + 10 = 40
    // Average = 300 / 40 = 7.5%
    expect(stats?.overallImprovement).toBe(7.5);
  });

  it('should evaluate isPositive, isNegative, and formatting helpers correctly', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    // getTestDate
    expect(component['getTestDate']('test-oldest')).toBe('2026-06-20T10:00:00Z');
    expect(component['getTestDate']('invalid')).toBeNull();
    expect(component['getTestDate'](undefined)).toBeNull();

    // isPositive / isNegative
    expect(component['isPositive']('5.00', true)).toBe(true);
    expect(component['isPositive']('-5.00', true)).toBe(false);
    expect(component['isPositive']('N/A', true)).toBe(false);
    expect(component['isPositive']('-2.00', false)).toBe(true);
    expect(component['isPositive']('2.00', false)).toBe(false);

    expect(component['isNegative']('-5.00', true)).toBe(true);
    expect(component['isNegative']('5.00', true)).toBe(false);
    expect(component['isNegative']('N/A', true)).toBe(false);
    expect(component['isNegative']('2.00', false)).toBe(true);
    expect(component['isNegative']('-2.00', false)).toBe(false);

    // formatting
    expect(component['formatDeltaSign']('N/A')).toBe('N/A');
    expect(component['formatDeltaSign']('5.00')).toBe('+5.00');
    expect(component['formatDeltaSign']('-3.00')).toBe('-3.00');
    expect(component['formatDeltaSign']('abc')).toBe('abc');

    expect(component['formatPctSign']('N/A')).toBe('N/A');
    expect(component['formatPctSign']('12.50')).toBe('+12.50%');
    expect(component['formatPctSign']('-6.00')).toBe('-6.00%');
    expect(component['formatPctSign']('abc')).toBe('abc');
  });

  it('should load pre-calculated snapshot when savedReport is passed as input', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);

    const mockSaved: ReportResponse = {
      reportId: 'report-999',
      athleteId: 'athlete-123',
      createdAt: '2026-06-26T10:00:00Z',
      testIds: ['test-oldest', 'test-newest'],
      payload: {
        athleteId: 'athlete-123',
        analysisType: 'COMPARISON',
        testIdA: 'test-oldest',
        testIdB: 'test-newest',
        comparisonResults: [
          {
            exerciseTitle: 'Pushups',
            resultA: 10,
            resultB: 15,
            delta: '5.00',
            percentageChange: '50.00',
            unit: 'COUNT',
            greaterIsBetter: true
          }
        ]
      }
    };

    fixture.componentRef.setInput('savedReport', mockSaved);
    fixture.detectChanges();

    expect(component['reportResult']()).toEqual(mockSaved.payload);
    expect(component['analysisType']()).toBe('COMPARISON');
    expect(component['testIdA']()).toBe('test-oldest');
    expect(component['testIdB']()).toBe('test-newest');
    expect(component['selectedExerciseForChart']()).toBe('Pushups');
  });

  it('should call saveReport api when onSaveReport is called', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    reportsApiServiceMock.saveReport.mockReturnValue(of({}));

    component['analysisType'].set('COMPARISON');
    component['testIdA'].set('test-oldest');
    component['testIdB'].set('test-newest');

    let emitted = false;
    component.reportSaved.subscribe(() => emitted = true);

    component['onSaveReport']();

    expect(reportsApiServiceMock.saveReport).toHaveBeenCalledWith({
      analysisType: 'COMPARISON',
      athleteId: 'athlete-123',
      testIdA: 'test-oldest',
      testIdB: 'test-newest',
      startDate: undefined,
      endDate: undefined,
    });
    expect(component['reportIsSaved']()).toBe(true);
    expect(emitted).toBe(true);
  });

  it('should set isExportingPDF to true when onExportPDF is called', () => {
    const fixture = TestBed.createComponent(ReportDashboardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('athleteId', 'athlete-123');
    fixture.componentRef.setInput('tests', mockTests);
    fixture.detectChanges();

    const mockPreview: ReportPreviewResponse = {
      athleteId: 'athlete-123',
      analysisType: 'COMPARISON',
      lowOverlap: false,
      comparisonResults: []
    };
    component['reportResult'].set(mockPreview);

    component['onExportPDF']();
    expect(component['isExportingPDF']()).toBe(true);
  });
});
