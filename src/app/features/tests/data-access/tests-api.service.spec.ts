import { TestBed } from '@angular/core/testing';
import { TestsApiService } from './tests-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, inject } from 'vitest';
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
});
