import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseFormRowComponent } from './exercise-form-row.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementUnit } from '../../data-access/test.model';

describe('ExerciseFormRowComponent', () => {
  let component: ExerciseFormRowComponent;
  let fixture: ComponentFixture<ExerciseFormRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseFormRowComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseFormRowComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('formGroup', new FormGroup({
      exerciseTitle: new FormControl('', Validators.required),
      result: new FormControl(0, Validators.required),
      unit: new FormControl(MeasurementUnit.CM),
      greaterIsBetter: new FormControl(true),
    }));
    fixture.componentRef.setInput('index', 0);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
