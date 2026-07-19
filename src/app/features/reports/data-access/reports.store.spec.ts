import { TestBed } from '@angular/core/testing';
import { ReportsStore } from './reports.store';
import { ReportsApiService } from './reports-api.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ReportsStore', () => {
  let store: ReportsStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any;

  beforeEach(() => {
    apiMock = {
      getReportsByAthlete: vi.fn().mockReturnValue(of([])),
      saveReport: vi.fn().mockReturnValue(of({ reportId: 'report1' })),
      deleteReport: vi.fn().mockReturnValue(of(null)),
      generatePreview: vi.fn().mockReturnValue(of({ exerciseTrends: [] })),
    };

    TestBed.configureTestingModule({
      providers: [
        ReportsStore,
        { provide: ReportsApiService, useValue: apiMock }
      ]
    });

    store = TestBed.inject(ReportsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should load reports for athlete', () => {
    store.loadReportsForAthlete('athlete1');
    // @ts-expect-error accessing private signal for test verification
    expect(store.currentAthleteId()).toBe('athlete1');
  });

  it('should save report', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.saveReport({} as any).subscribe(res => {
      expect(res.reportId).toBe('report1');
    });
    expect(apiMock.saveReport).toHaveBeenCalled();
  });

  it('should delete report', () => {
    store.deleteReport('report1').subscribe();
    expect(apiMock.deleteReport).toHaveBeenCalledWith('report1');
  });

  it('should generate preview', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.generatePreview({} as any).subscribe(res => {
      expect(res.exerciseTrends).toEqual([]);
    });
    expect(apiMock.generatePreview).toHaveBeenCalled();
  });
});
