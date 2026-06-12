import '@angular/compiler';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AthleteCreatePage } from './athlete-create.page';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { AthleteFormComponent } from '../../ui/athlete-form/athlete-form.component';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {}

describe('AthleteCreatePage', () => {
  let component: AthleteCreatePage;
  let fixture: ComponentFixture<AthleteCreatePage>;
  let athletesApi: any;
  let router: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    athletesApi = {
      createAthlete: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AthleteCreatePage, AthleteFormComponent],
      providers: [
        { provide: AthletesApiService, useValue: athletesApi },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle successful athlete creation', () => {
    const mockAthlete = { firstName: 'Mario', lastName: 'Rossi', athleteId: '123' };
    athletesApi.createAthlete.mockReturnValue(of(mockAthlete));

    component['onSave']({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    expect(component['isSubmitting']()).toBe(false);
    expect(component['successMessage']()).toContain('registrato con successo');
    
    vi.advanceTimersByTime(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/athletes']);
  });

  it('should handle connection error (status 0)', () => {
    const error = new HttpErrorResponse({ status: 0 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    component['onSave']({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    expect(component['isSubmitting']()).toBe(false);
    expect(component['errorMessage']()).toContain('server non risponde');
  });

  it('should handle conflict error (status 409)', () => {
    const error = new HttpErrorResponse({ status: 409 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    component['onSave']({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    expect(component['isSubmitting']()).toBe(false);
    expect(component['errorMessage']()).toContain('già registrato');
  });

  it('should handle server error (status 500)', () => {
    const error = new HttpErrorResponse({ status: 500 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    component['onSave']({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    expect(component['isSubmitting']()).toBe(false);
    expect(component['errorMessage']()).toContain('Errore del server');
  });
});
