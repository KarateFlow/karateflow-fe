import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardApiService, DashboardSummary } from './dashboard-api.service';
// environment not needed for relative url test

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return dashboard summary on success', () => {
    const mockResponse: DashboardSummary = {
      totalAthletes: 10,
      totalTests: 50,
      totalReports: 20,
      recentTests: [],
      recentReports: []
    };

    service.getSummary().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`/dashboard/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return zeroes on failure', () => {
    const fallbackResponse: DashboardSummary = {
      totalAthletes: 0,
      totalTests: 0,
      totalReports: 0,
      recentTests: [],
      recentReports: []
    };

    service.getSummary().subscribe(response => {
      expect(response).toEqual(fallbackResponse);
    });

    const req = httpMock.expectOne(`/dashboard/summary`);
    req.error(new ProgressEvent('Network error'));
  });
});
