import '@angular/compiler';
import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AthleteCreatePage } from './athlete-create.page';
import { AthleteFormComponent } from '../../ui/athlete-form/athlete-form.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AthletesApiService } from '../../data-access/athletes-api.service';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('AthleteCreatePage', () => {
  let component: AthleteCreatePage;
  let fixture: ComponentFixture<AthleteCreatePage>;
  let athletesApi: { createAthlete: Mock };
  let router: { navigate: Mock };
  let toastService: { success: Mock, error: Mock, warning: Mock, info: Mock };

  beforeEach(async () => {
    vi.useFakeTimers();
    athletesApi = {
      createAthlete: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AthleteCreatePage, AthleteFormComponent],
      providers: [
        { provide: AthletesApiService, useValue: athletesApi },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService }
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

    // @ts-expect-error - Accesso a metodo protetto per il test
    component.onSave({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    // @ts-expect-error - Accesso a segnale protetto per il test
    expect(component.isSubmitting()).toBe(false);
    expect(toastService.success).toHaveBeenCalledWith(expect.stringContaining('registrato con successo'));
    
    vi.advanceTimersByTime(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/athletes']);
  });

  it('should handle connection error (status 0)', () => {
    const error = new HttpErrorResponse({ status: 0 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    // @ts-expect-error - Accesso a metodo protetto per il test
    component.onSave({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    // @ts-expect-error - Accesso a segnale protetto per il test
    expect(component.isSubmitting()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('server non risponde'));
  });

  it('should handle conflict error (status 409)', () => {
    const error = new HttpErrorResponse({ status: 409 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    // @ts-expect-error - Accesso a metodo protetto per il test
    component.onSave({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    // @ts-expect-error - Accesso a segnale protetto per il test
    expect(component.isSubmitting()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('già registrato'));
  });

  it('should handle server error (status 500)', () => {
    const error = new HttpErrorResponse({ status: 500 });
    athletesApi.createAthlete.mockReturnValue(throwError(() => error));

    // @ts-expect-error - Accesso a metodo protetto per il test
    component.onSave({ firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01' });

    // @ts-expect-error - Accesso a segnale protetto per il test
    expect(component.isSubmitting()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('Errore del server'));
  });
});
