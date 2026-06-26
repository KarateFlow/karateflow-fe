import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestDetailPage } from './test-detail.page';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';
import { MeasurementUnit } from '../../data-access/test.model';

describe('TestDetailPage', () => {
  let component: TestDetailPage;
  let fixture: ComponentFixture<TestDetailPage>;
  let mockAthletesApi: { getAthlete: Mock };
  let mockTestsApi: { getTest: Mock; updateTest: Mock; deleteTest: Mock };
  let router: Router;

  const athleteId = 'ath-123';
  const testId = 'test-456';

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of({ athleteId, firstName: 'Mario', lastName: 'Rossi' })),
    };
    mockTestsApi = {
      getTest: vi.fn().mockReturnValue(of({
        id: testId,
        athleteId,
        executionDate: '2026-06-20T10:00:00Z',
        type: 'Test Forza',
        coachNotes: 'Nota di test',
        exercises: [
          { exerciseTitle: 'Pushup', result: 25, unit: MeasurementUnit.COUNT, greaterIsBetter: true }
        ],
        createdAt: '2026-06-20T10:05:00Z'
      })),
      updateTest: vi.fn().mockReturnValue(of({})),
      deleteTest: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TestDetailPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'id') return athleteId;
                  if (key === 'testId') return testId;
                  return null;
                }
              }
            }
          }
        },
        { provide: AthletesApiService, useValue: mockAthletesApi },
        { provide: TestsApiService, useValue: mockTestsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDetailPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
  });

  it('should create', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should display loading state when test data is loading', () => {
    const loadingSubject = new Subject<any>();
    mockTestsApi.getTest.mockReturnValue(loadingSubject);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-state')).toBeTruthy();
  });

  it('should display error state and support retry when fetch fails', async () => {
    mockTestsApi.getTest.mockReturnValue(throwError(() => new Error('Fetch Error')));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-banner')).toBeTruthy();

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLElement;
    expect(retryBtn).toBeTruthy();
    
    // Set the mock to succeed on retry
    mockTestsApi.getTest.mockReturnValue(of(testResourceVal()));
    
    // Click retry
    retryBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockTestsApi.getTest).toHaveBeenCalledTimes(2);
  });

  it('should render test details in read-only mode by default', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Forza');
    expect(compiled.textContent).toContain('Nota di test');
    expect(compiled.querySelector('.exercises-table')).toBeTruthy();
    expect(compiled.querySelector('.btn-edit')).toBeTruthy();
    expect(compiled.querySelector('.btn-delete')).toBeTruthy();
  });

  it('should start editing and pre-populate the form', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    expect(component['isEditing']()).toBe(true);
    expect(component['testForm'].value.type).toBe('Test Forza');
    expect(component['testForm'].value.coachNotes).toBe('Nota di test');
    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value.exerciseTitle).toBe('Pushup');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.test-form')).toBeTruthy();
    expect(compiled.querySelector('.btn-cancel')).toBeTruthy();
  });

  it('should duplicate an exercise and increment its suffix number correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    expect(component.exercises.length).toBe(1);

    // Duplicate once
    component['duplicateExercise'](0);
    fixture.detectChanges();
    expect(component.exercises.length).toBe(2);
    expect(component.exercises.at(1).value.exerciseTitle).toBe('Pushup #2');

    // Duplicate the duplicate
    component['duplicateExercise'](1);
    fixture.detectChanges();
    expect(component.exercises.length).toBe(3);
    expect(component.exercises.at(2).value.exerciseTitle).toBe('Pushup #3');
  });

  it('should clear form and exit edit mode on cancelEdit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    component['cancelEdit']();
    fixture.detectChanges();

    expect(component['isEditing']()).toBe(false);
    expect(component['testForm'].value.type).toBeNull();
  });

  it('should call delete API and navigate to profile on onConfirmDelete', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await component['onConfirmDelete']();

    expect(mockTestsApi.deleteTest).toHaveBeenCalledWith(testId);
    expect(router.navigate).toHaveBeenCalledWith(['/athletes', athleteId]);
  });

  it('should call update API and reload test details on onConfirmSave', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();
    
    // Modify form
    component['testForm'].patchValue({
      type: 'Updated Type',
    });

    await component['onConfirmSave']();
    fixture.detectChanges();

    expect(mockTestsApi.updateTest).toHaveBeenCalledWith(testId, expect.objectContaining({
      type: 'Updated Type'
    }));
    expect(component['isEditing']()).toBe(false);
  });

  it('should add a new exercise to the exercises form array', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    const initialLength = component.exercises.length;
    component['addExercise']();
    fixture.detectChanges();

    expect(component.exercises.length).toBe(initialLength + 1);
    expect(component.exercises.at(initialLength).value.exerciseTitle).toBe('');
  });

  it('should remove an exercise from the exercises form array', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    expect(component.exercises.length).toBe(1);

    component['removeExercise'](0);
    fixture.detectChanges();

    expect(component.exercises.length).toBe(0);
  });

  it('should show save confirmation dialog when form is valid on pre-submit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();
    
    component['onPreSubmitSave']();
    fixture.detectChanges();

    expect(component['showSaveConfirm']()).toBe(true);
  });

  it('should mark form and exercises as touched when form is invalid on pre-submit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();
    
    // Make form invalid by clearing an exercise title
    component.exercises.at(0).get('exerciseTitle')?.setValue('');
    fixture.detectChanges();

    component['onPreSubmitSave']();
    fixture.detectChanges();

    expect(component['showSaveConfirm']()).toBe(false);
    expect(component['testForm'].touched).toBe(true);
  });

  it('should log error and reset isSaving on save failure', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTestsApi.updateTest.mockReturnValue(throwError(() => new Error('Save Error')));

    const testData = testResourceVal();
    component['startEdit'](testData);
    fixture.detectChanges();

    await component['onConfirmSave']();
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith("Errore durante l'aggiornamento del test:", expect.any(Error));
    expect(component['isSaving']()).toBe(false);
  });

  it('should log error on delete failure', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTestsApi.deleteTest.mockReturnValue(throwError(() => new Error('Delete Error')));

    await component['onConfirmDelete']();
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith("Errore durante l'eliminazione del test:", expect.any(Error));
  });

  it('should cast AbstractControl to FormGroup in asFormGroup', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const group = component['asFormGroup'](component.exercises);
    expect(group).toBe(component.exercises);
  });

  function testResourceVal() {
    return {
      id: testId,
      athleteId,
      executionDate: '2026-06-20T10:00:00Z',
      type: 'Test Forza',
      coachNotes: 'Nota di test',
      exercises: [
        { exerciseTitle: 'Pushup', result: 25, unit: MeasurementUnit.COUNT, greaterIsBetter: true }
      ],
      createdAt: '2026-06-20T10:05:00Z'
    };
  }
});
