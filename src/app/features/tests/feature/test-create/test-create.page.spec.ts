import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestCreatePage } from './test-create.page';
import { provideRouter } from '@angular/router';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestsApiService } from '../../data-access/tests-api.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';

describe('TestCreatePage', () => {
  let component: TestCreatePage;
  let fixture: ComponentFixture<TestCreatePage>;
  let mockAthletesApi: { getAthlete: Mock };
  let mockTestsApi: { createTest: Mock };

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of({ athleteId: '123', firstName: 'Mario', lastName: 'Rossi' })),
    };
    mockTestsApi = {
      createTest: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TestCreatePage, ReactiveFormsModule],
      providers: [
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

  it('should add a new exercise to the form array', () => {
    expect(component.exercises.length).toBe(0);
    component['addExercise'](); // call protected method
    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).get('exerciseTitle')?.value).toBe('');
  });

  it('should duplicate an existing exercise', () => {
    component['addExercise']();
    component.exercises.at(0).patchValue({ exerciseTitle: 'Jump', result: 50 });
    
    component['duplicateExercise'](0);
    
    expect(component.exercises.length).toBe(2);
    expect(component.exercises.at(1).get('exerciseTitle')?.value).toBe('Jump #2');
    expect(component.exercises.at(1).get('result')?.value).toBe(50);
  });

  it('should remove an exercise from the form array', () => {
    component['addExercise']();
    expect(component.exercises.length).toBe(1);
    component['removeExercise'](0);
    expect(component.exercises.length).toBe(0);
  });
});
