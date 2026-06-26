import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestDetailPage } from './test-detail.page';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { of } from 'rxjs';
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start editing and pre-populate the form', () => {
    const testData = testResourceVal();
    component['startEdit'](testData);

    expect(component['isEditing']()).toBe(true);
    expect(component['testForm'].value.type).toBe('Test Forza');
    expect(component['testForm'].value.coachNotes).toBe('Nota di test');
    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value.exerciseTitle).toBe('Pushup');
  });

  it('should duplicate an exercise and increment its suffix number correctly', () => {
    const testData = testResourceVal();
    component['startEdit'](testData);

    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value.exerciseTitle).toBe('Pushup');

    // Duplicate once
    component['duplicateExercise'](0);
    expect(component.exercises.length).toBe(2);
    expect(component.exercises.at(1).value.exerciseTitle).toBe('Pushup #2');

    // Duplicate the duplicate
    component['duplicateExercise'](1);
    expect(component.exercises.length).toBe(3);
    expect(component.exercises.at(2).value.exerciseTitle).toBe('Pushup #3');
  });

  it('should clear form and exit edit mode on cancelEdit', () => {
    const testData = testResourceVal();
    component['startEdit'](testData);
    component['cancelEdit']();

    expect(component['isEditing']()).toBe(false);
    expect(component['testForm'].value.type).toBeNull();
  });

  it('should call delete API and navigate to profile on onConfirmDelete', async () => {
    await component['onConfirmDelete']();

    expect(mockTestsApi.deleteTest).toHaveBeenCalledWith(testId);
    expect(router.navigate).toHaveBeenCalledWith(['/athletes', athleteId]);
  });

  it('should call update API and reload test details on onConfirmSave', async () => {
    const testData = testResourceVal();
    component['startEdit'](testData);
    
    // Modify form
    component['testForm'].patchValue({
      type: 'Updated Type',
    });

    await component['onConfirmSave']();

    expect(mockTestsApi.updateTest).toHaveBeenCalledWith(testId, expect.objectContaining({
      type: 'Updated Type'
    }));
    expect(component['isEditing']()).toBe(false);
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
