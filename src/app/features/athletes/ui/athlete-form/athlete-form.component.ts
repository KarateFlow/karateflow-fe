import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecordAthleteRequest } from '../../data-access/athlete.model';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-athlete-form',
  imports: [ReactiveFormsModule, UiInputComponent, UiButtonComponent],
  templateUrl: './athlete-form.component.html',
  styleUrl: './athlete-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteFormComponent {
  isSubmitting = input<boolean>(false);
  save = output<RecordAthleteRequest>();

  protected readonly athleteForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    referenceContact: new FormControl(''),
    medicalNotes: new FormControl(''),
  });

  protected readonly avatarPreview = signal<string | null>(null);

  protected isInvalid(controlName: string): boolean {
    const control = this.athleteForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  protected getInitials(): string {
    const f = this.athleteForm.get('firstName')?.value || '';
    const l = this.athleteForm.get('lastName')?.value || '';
    if (!f && !l) return 'AT';
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.avatarPreview.set(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  protected onSubmit(): void {
    if (this.athleteForm.valid) {
      this.save.emit(this.athleteForm.getRawValue());
    } else {
      this.athleteForm.markAllAsTouched();
    }
  }
}
