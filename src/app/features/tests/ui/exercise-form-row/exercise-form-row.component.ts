import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MeasurementUnit } from '../../data-access/test.model';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../../shared/ui/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-exercise-form-row',
  standalone: true,
  imports: [ReactiveFormsModule, UiInputComponent, UiSelectComponent, UiButtonComponent],
  templateUrl: './exercise-form-row.component.html',
  styleUrl: './exercise-form-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseFormRowComponent {
  formGroup = input.required<FormGroup>();
  index = input.required<number>();
  
  duplicate = output<void>();
  remove = output<void>();

  protected readonly units = Object.values(MeasurementUnit);

  protected isInvalid(controlName: string): boolean {
    const control = this.formGroup().get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }
}
