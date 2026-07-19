import { TestBed } from '@angular/core/testing';
import { TemplatesApiService } from './templates-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTestTemplateRequest, MeasurementUnit } from './test.model';
// environment not needed for relative url test

describe('TemplatesApiService', () => {
  let service: TemplatesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TemplatesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TemplatesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to create template', () => {
    const mockRequest: CreateTestTemplateRequest = {
      name: 'General',
      exercises: [
        { exerciseTitle: 'Jump', unit: MeasurementUnit.CM, greaterIsBetter: true }
      ]
    };

    service.createTemplate(mockRequest).subscribe();

    const req = httpMock.expectOne(`/templates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({});
  });

  it('should send GET request to retrieve all templates', () => {
    service.getTemplates().subscribe();

    const req = httpMock.expectOne(`/templates`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send GET request to retrieve single template by id', () => {
    service.getTemplate('456').subscribe();

    const req = httpMock.expectOne(`/templates/456`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should send PUT request to update template', () => {
    const mockRequest = {
      name: 'Updated General',
      exercises: []
    };

    service.updateTemplate('456', mockRequest).subscribe();

    const req = httpMock.expectOne(`/templates/456`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({});
  });

  it('should send DELETE request to remove template', () => {
    service.deleteTemplate('456').subscribe();

    const req = httpMock.expectOne(`/templates/456`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
