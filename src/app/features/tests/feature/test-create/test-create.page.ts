import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AthletesApiService } from '../../../athletes/data-access/athletes-api.service';
import { TestStore } from '../../data-access/test.store';
import { TemplateStore } from '../../data-access/template.store';
import { CreateTestRequest, MeasurementUnit, TestTemplateResponse } from '../../data-access/test.model';
import { ExerciseFormRowComponent } from '../../ui/exercise-form-row/exercise-form-row.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiSelectComponent } from '../../../../shared/ui/ui-select/ui-select.component';

/**
 * Validator to ensure date is not in the future
 */
export function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, unknown> | null => {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value as string);
    const now = new Date();
    return selectedDate > now ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-test-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgClass, ExerciseFormRowComponent, ConfirmDialogComponent, UiInputComponent, UiButtonComponent, UiSelectComponent],
  templateUrl: './test-create.page.html',
  styleUrl: './test-create.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCreatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly athletesApi = inject(AthletesApiService);
  private readonly testStore = inject(TestStore);
  private readonly templateStore = inject(TemplateStore);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastService = inject(ToastService);

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly isSubmitting = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly athleteResource = resource({
    loader: async () => {
      const athlete = await firstValueFrom(this.athletesApi.getAthlete(this.athleteId()));
      this.breadcrumbService.setLabel(this.athleteId(), `${athlete.firstName} ${athlete.lastName}`);
      return athlete;
    },
  });

  protected readonly templatesResource = this.templateStore.templatesResource;

  protected readonly testForm = new FormGroup({
    athleteId: new FormControl(this.athleteId(), { nonNullable: true, validators: [Validators.required] }),
    executionDate: new FormControl(this.getCurrentDateTime(), { nonNullable: true, validators: [Validators.required, noFutureDateValidator()] }),
    type: new FormControl(''),
    coachNotes: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.testForm.get('exercises') as FormArray;
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

  protected onTemplateSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const templateId = select.value;
    if (!templateId) return;

    const templates = this.templatesResource.value() ?? [];
    const selected = templates.find((t: TestTemplateResponse) => t.id === templateId);
    if (selected) {
      this.exercises.clear();
      selected.exercises.forEach((ex: { exerciseTitle: string, unit: MeasurementUnit, greaterIsBetter: boolean }) => {
        this.exercises.push(new FormGroup({
          exerciseTitle: new FormControl(ex.exerciseTitle, { nonNullable: true, validators: [Validators.required] }),
          result: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
          unit: new FormControl(ex.unit, { nonNullable: true, validators: [Validators.required] }),
          greaterIsBetter: new FormControl(ex.greaterIsBetter, { nonNullable: true, validators: [Validators.required] }),
        }));
      });
      this.exercises.markAsDirty();

      const typeControl = this.testForm.get('type');
      if (typeControl && !typeControl.value) {
        typeControl.setValue(selected.name);
      }
    }
  }

  protected asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.testForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected onPreSubmit(): void {
    if (this.testForm.valid) {
      this.showConfirm.set(true);
    } else {
      this.testForm.markAllAsTouched();
      // Mark FormArray and all its groups as touched
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showConfirm.set(false);
    this.isSubmitting.set(true);

    try {
      const payload = this.testForm.getRawValue();
      await this.testStore.createTest(payload as CreateTestRequest);
      this.toastService.success('Test salvato con successo!');
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      this.isSubmitting.set(false);
      this.toastService.error(this.testStore.getErrorMessage(error));
      console.error('Errore durante il salvataggio del test:', error);
    }
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}
