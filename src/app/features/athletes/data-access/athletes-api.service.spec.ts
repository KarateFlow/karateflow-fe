import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, fail } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { environment } from '../../../../environments/environment';
import { Athlete, RecordAthleteRequest } from './athlete.model';
import { AthletesApiService } from './athletes-api.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('AthletesApiService', () => {
  let service: AthletesApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/athletes`;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AthletesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AthletesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createAthlete', () => {
    it('should send a POST request to create an athlete', () => {
      const mockRequest: RecordAthleteRequest = {
        firstName: 'Gichi',
        lastName: 'Funakoshi',
        birthDate: '1868-11-10',
        referenceContact: 'Shotokan',
        medicalNotes: 'Founder of modern karate',
      };

      const mockResponse: Athlete = {
        athleteId: 'kf-1',
        ...mockRequest,
        createdAt: new Date().toISOString(),
      };

      service.createAthlete(mockRequest).subscribe((athlete) => {
        expect(athlete).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle error when creation fails', () => {
      const mockRequest: RecordAthleteRequest = {
        firstName: 'Test',
        lastName: 'Error',
        birthDate: '2000-01-01',
      };

      service.createAthlete(mockRequest).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
