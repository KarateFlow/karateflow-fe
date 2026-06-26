import { TestBed } from '@angular/core/testing';
import { TestsApiService } from './tests-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTestRequest, MeasurementUnit } from './test.model';
import { environment } from '../../../../environments/environment';

describe('TestsApiService', () => {
  let service: TestsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TestsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to create test', () => {
    const mockRequest: CreateTestRequest = {
      athleteId: '123',
      executionDate: '2023-01-01T10:00',
      exercises: [
        { exerciseTitle: 'Jump', result: 50, unit: MeasurementUnit.CM, greaterIsBetter: true }
      ]
    };

    service.createTest(mockRequest).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tests`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({});
  });

  it('should send GET request to retrieve tests by athlete id', () => {
    service.getTestsByAthlete('123').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tests?athleteId=123`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send GET request to retrieve single test by id', () => {
    service.getTest('456').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tests/456`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should send PUT request to update test', () => {
    const mockRequest = {
      type: 'Updated Test',
      coachNotes: 'Notes',
      exercises: []
    };

    service.updateTest('456', mockRequest).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tests/456`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({});
  });

  it('should send DELETE request to remove test', () => {
    service.deleteTest('456').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tests/456`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
