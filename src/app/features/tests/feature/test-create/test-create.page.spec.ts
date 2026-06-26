import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestCreatePage, noFutureDateValidator } from './test-create.page';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('TestCreatePage', () => {
  let component: TestCreatePage;
  let fixture: ComponentFixture<TestCreatePage>;
  let mockAthletesApi: { getAthlete: Mock };
  let mockTestsApi: { createTest: Mock };

  const athleteId = '123';

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of({ athleteId: athleteId, firstName: 'Mario', lastName: 'Rossi' })),
    };
    mockTestsApi = {
      createTest: vi.fn().mockReturnValue(of({})),
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
});
