import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestStore } from '../../data-access/test.store';
import { MeasurementUnit, TestResponse, UpdateTestRequest } from '../../data-access/test.model';
import { ExerciseFormRowComponent } from '../../ui/exercise-form-row/exercise-form-row.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-test-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, NgClass, ReactiveFormsModule, ConfirmDialogComponent, ExerciseFormRowComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './test-detail.page.html',
  styleUrl: './test-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testStore = inject(TestStore);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.testStore.selectTest(this.route.snapshot.paramMap.get('testId')!);
  }

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly testId = signal(this.route.snapshot.paramMap.get('testId')!);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly showSaveConfirm = signal(false);
  protected readonly showDeleteConfirm = signal(false);

  protected readonly athleteResource = resource({
    loader: async () => {
      const athlete = await firstValueFrom(this.athletesApi.getAthlete(this.athleteId()));
      this.breadcrumbService.setLabel(this.athleteId(), `${athlete.firstName} ${athlete.lastName}`);
      return athlete;
    },
  });

  protected readonly testResource = this.testStore.selectedTestResource;

  protected readonly testForm = new FormGroup({
    type: new FormControl(''),
    coachNotes: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.testForm.get('exercises') as FormArray;
  }

  protected startEdit(test: TestResponse): void {
    this.testForm.patchValue({
      type: test.type || '',
      coachNotes: test.coachNotes || ''
    });

    this.exercises.clear();
    test.exercises.forEach(ex => {
      const group = new FormGroup({
        exerciseTitle: new FormControl(ex.exerciseTitle, { nonNullable: true, validators: [Validators.required] }),
        result: new FormControl<number | null>(ex.result, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        unit: new FormControl(ex.unit, { nonNullable: true, validators: [Validators.required] }),
        greaterIsBetter: new FormControl(ex.greaterIsBetter, { nonNullable: true, validators: [Validators.required] }),
      });
      this.exercises.push(group);
    });

    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.testForm.reset();
  }

  protected addExercise(): void {
    const exerciseGroup = new FormGroup({
      exerciseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      result: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      unit: new FormControl(MeasurementUnit.CM, { nonNullable: true, validators: [Validators.required] }),
      greaterIsBetter: new FormControl(true, { nonNullable: true, validators: [Validators.required] }),
    });
    this.exercises.push(exerciseGroup);
    this.exercises.markAsDirty();
  }

  protected duplicateExercise(index: number): void {
    const source = this.exercises.at(index) as FormGroup;
    const title = source.value.exerciseTitle as string;
    const match = title.match(/(.*?)\s*#(\d+)$/);
    const newTitle = match ? `${match[1]} #${parseInt(match[2], 10) + 1}` : `${title} #2`;

    const duplicate = new FormGroup({
      exerciseTitle: new FormControl(newTitle, { nonNullable: true, validators: [Validators.required] }),
      result: new FormControl(source.value.result as number, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      unit: new FormControl(source.value.unit as MeasurementUnit, { nonNullable: true, validators: [Validators.required] }),
      greaterIsBetter: new FormControl(source.value.greaterIsBetter as boolean, { nonNullable: true, validators: [Validators.required] }),
    });
    this.exercises.push(duplicate);
    this.exercises.markAsDirty();
  }

  protected removeExercise(index: number): void {
    this.exercises.removeAt(index);
    this.exercises.markAsDirty();
  }

  protected asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  protected onPreSubmitSave(): void {
    if (this.testForm.valid) {
      this.showSaveConfirm.set(true);
    } else {
      this.testForm.markAllAsTouched();
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showSaveConfirm.set(false);
    this.isSaving.set(true);

    try {
      const payload = this.testForm.getRawValue();
      await this.testStore.updateTest(this.testId(), payload as UpdateTestRequest);
      this.toastService.success('Test aggiornato con successo!');
      this.isEditing.set(false);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del test:', error);
      this.toastService.error(this.testStore.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async onConfirmDelete(): Promise<void> {
    this.showDeleteConfirm.set(false);
    try {
      await this.testStore.deleteTest(this.testId());
      this.toastService.success('Test eliminato con successo!');
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      console.error('Errore durante l\'eliminazione del test:', error);
      this.toastService.error(this.testStore.getErrorMessage(error));
    }
  }
}
