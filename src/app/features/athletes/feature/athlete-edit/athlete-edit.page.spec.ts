import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteEditPage } from './athlete-edit.page';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { of, throwError } from 'rxjs';
import { Athlete } from '../../data-access/athlete.model';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';

describe('AthleteEditPage', () => {
  let component: AthleteEditPage;
  let fixture: ComponentFixture<AthleteEditPage>;
  let mockAthletesApi: { getAthlete: Mock; updateAthlete: Mock };
  let router: Router;

  const mockAthlete: Athlete = {
    athleteId: '123',
    firstName: 'Mario',
    lastName: 'Rossi',
    birthDate: '1990-01-01',
    referenceContact: '3331234567',
    medicalNotes: 'Nessuna',
    createdAt: '2023-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of(mockAthlete)),
      updateAthlete: vi.fn().mockReturnValue(of(mockAthlete)),
    };

    await TestBed.configureTestingModule({
      imports: [AthleteEditPage, ReactiveFormsModule],
      providers: [
        provideRouter([
          { path: 'athletes/:id/edit', component: AthleteEditPage },
          { path: 'athletes/:id', component: class {} }
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? '123' : null
              }
            }
          }
        },
        { provide: AthletesApiService, useValue: mockAthletesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteEditPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('should create and load athlete details into the form', async () => {
    expect(component).toBeTruthy();
    
    // Trigger Angular Resource load
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockAthletesApi.getAthlete).toHaveBeenCalledWith('123');
    expect(component['editForm'].value).toEqual({
      referenceContact: '3331234567',
      medicalNotes: 'Nessuna',
    });
  });

  it('should handle API error when loading athlete details', async () => {
    mockAthletesApi.getAthlete.mockReturnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['athleteResource'].error()).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-banner')).toBeTruthy();
  });

  it('should show confirmation dialog on pre-submit if form is valid', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['showConfirm']()).toBe(false);

    component['onPreSubmit']();
    expect(component['showConfirm']()).toBe(true);
  });

  it('should save updates and navigate to detail page on confirm save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component['editForm'].patchValue({
      referenceContact: '9999999999',
      medicalNotes: 'Nuova nota',
    });
    component['editForm'].markAsDirty();

    component['onPreSubmit']();
    expect(component['showConfirm']()).toBe(true);

    await component['onConfirmSave']();

    expect(component['showConfirm']()).toBe(false);
    expect(mockAthletesApi.updateAthlete).toHaveBeenCalledWith('123', {
      referenceContact: '9999999999',
      medicalNotes: 'Nuova nota',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/athletes', '123']);
  });

  it('should log error and reset isSubmitting status if update fails', async () => {
    mockAthletesApi.updateAthlete.mockReturnValue(throwError(() => new Error('Save Error')));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await component['onConfirmSave']();

    expect(component['isSubmitting']()).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
