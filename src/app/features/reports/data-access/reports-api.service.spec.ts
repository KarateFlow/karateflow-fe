import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { environment } from '../../../../environments/environment';
import { ReportPreviewRequest, ReportPreviewResponse } from './reports.model';
import { ReportsApiService } from './reports-api.service';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('ReportsApiService', () => {
  let service: ReportsApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/reports/preview`;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ReportsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ReportsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generatePreview', () => {
    it('should send a POST request to generate report preview', () => {
      const mockRequest: ReportPreviewRequest = {
        analysisType: 'COMPARISON',
        athleteId: 'athlete-123',
        testIdA: 'test-A',
        testIdB: 'test-B',
      };

      const mockResponse: ReportPreviewResponse = {
        athleteId: 'athlete-123',
        analysisType: 'COMPARISON',
        lowOverlap: false,
        comparisonResults: [],
      };

      service.generatePreview(mockRequest).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
