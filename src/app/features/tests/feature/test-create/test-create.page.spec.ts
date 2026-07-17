import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestCreatePage, noFutureDateValidator } from './test-create.page';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { TemplatesApiService } from '../../data-access/templates-api.service';
import { MeasurementUnit } from '../../data-access/test.model';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

describe('TestCreatePage', () => {
  let component: TestCreatePage;
  let fixture: ComponentFixture<TestCreatePage>;
  let mockAthletesApi: { getAthlete: Mock };
  let mockTestsApi: { createTest: Mock };
  let mockTemplatesApi: { getTemplates: Mock };
  let toastService: { success: Mock, error: Mock, warning: Mock, info: Mock };

  const athleteId = '123';

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of({ athleteId: athleteId, firstName: 'Mario', lastName: 'Rossi' })),
    };
    mockTestsApi = {
      createTest: vi.fn().mockReturnValue(of({})),
    };
    mockTemplatesApi = {
      getTemplates: vi.fn().mockReturnValue(of([
        {
          id: 'template-123',
          name: 'Forza Generale',
          description: 'Descrizione del template',
          createdAt: '2026-06-26T12:00:00Z',
          exercises: [
            { exerciseTitle: 'Bench Press', unit: MeasurementUnit.KG, greaterIsBetter: true }
          ]
        }
      ]))
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TestCreatePage, ReactiveFormsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => athleteId
              }
            }
          }
        },
        provideRouter([]),
        { provide: AthletesApiService, useValue: mockAthletesApi },
        { provide: TestsApiService, useValue: mockTestsApi },
        { provide: TemplatesApiService, useValue: mockTemplatesApi },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid if exercises array is empty', () => {
    expect(component.exercises.length).toBe(0);
    expect(component['testForm'].get('exercises')?.hasError('required')).toBeTruthy();
  });

  it('should be valid if at least one exercise is present and form is filled', () => {
    // Explicitly set athleteId just in case
    component['testForm'].get('athleteId')?.setValue(athleteId);
    
    component['addExercise']();
    component.exercises.at(0).patchValue({
      exerciseTitle: 'Jump',
      result: 50,
    });
    
    expect(component['testForm'].get('athleteId')?.valid).toBeTruthy();
    expect(component['testForm'].get('executionDate')?.valid).toBeTruthy();
    expect(component['testForm'].get('exercises')?.valid).toBeTruthy();
    expect(component['testForm'].valid).toBeTruthy();
  });

  it('should duplicate an exercise and increment its suffix number correctly', () => {
    component['addExercise']();
    component.exercises.at(0).patchValue({
      exerciseTitle: 'Pushup',
      result: 25,
    });

    expect(component.exercises.length).toBe(1);

    // Duplicate once
    component['duplicateExercise'](0);
    expect(component.exercises.length).toBe(2);
    expect(component.exercises.at(1).value.exerciseTitle).toBe('Pushup #2');

    // Duplicate the duplicate
    component['duplicateExercise'](1);
    expect(component.exercises.length).toBe(3);
    expect(component.exercises.at(2).value.exerciseTitle).toBe('Pushup #3');
  });

  it('should validate that date is not in the future', () => {
    const control = new FormControl('2099-01-01T10:00');
    const validator = noFutureDateValidator();
    expect(validator(control)).toEqual({ futureDate: true });
    
    control.setValue('2020-01-01T10:00');
    expect(validator(control)).toBeNull();
  });

  it('should handle connection error (status 0) during save', async () => {
    const error = new HttpErrorResponse({ status: 0 });
    mockTestsApi.createTest.mockReturnValue(throwError(() => error));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component['onConfirmSave']();

    expect(component['isSubmitting']()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('server non risponde'));
    
    consoleSpy.mockRestore();
  });

  it('should handle bad request error (status 400) during save', async () => {
    const error = new HttpErrorResponse({ status: 400 });
    mockTestsApi.createTest.mockReturnValue(throwError(() => error));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component['onConfirmSave']();

    expect(component['isSubmitting']()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('non sono validi'));
    
    consoleSpy.mockRestore();
  });

  it('should handle server error (status 500) during save', async () => {
    const error = new HttpErrorResponse({ status: 500 });
    mockTestsApi.createTest.mockReturnValue(throwError(() => error));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component['onConfirmSave']();

    expect(component['isSubmitting']()).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('Errore del server'));
    
    consoleSpy.mockRestore();
  });

  it('should populate exercises FormArray when template is selected', () => {
    const selectEvent = {
      target: {
        value: 'template-123'
      }
    } as unknown as Event;

    // @ts-expect-error - accessing protected method
    component.onTemplateSelect(selectEvent);

    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value.exerciseTitle).toBe('Bench Press');
    expect(component.exercises.at(0).value.unit).toBe(MeasurementUnit.KG);
    expect(component.exercises.at(0).value.result).toBeNull();
    expect(component.exercises.at(0).value.greaterIsBetter).toBe(true);

    expect(component['testForm'].get('type')?.value).toBe('Forza Generale');
  });
});
