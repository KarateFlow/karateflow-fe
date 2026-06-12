import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecordAthleteRequest } from '../../data-access/athlete.model';

@Component({
  selector: 'app-athlete-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="athleteForm" (ngSubmit)="onSubmit()" class="athlete-form">
      <div class="form-grid">
        <div class="form-group">
          <label for="firstName">Nome</label>
          <input
            id="firstName"
            type="text"
            formControlName="firstName"
            [class.invalid]="isInvalid('firstName')"
            placeholder="Es. Gichin"
          />
          @if (isInvalid('firstName')) {
            <span class="error-msg">Il nome è obbligatorio</span>
          }
        </div>

        <div class="form-group">
          <label for="lastName">Cognome</label>
          <input
            id="lastName"
            type="text"
            formControlName="lastName"
            [class.invalid]="isInvalid('lastName')"
            placeholder="Es. Funakoshi"
          />
          @if (isInvalid('lastName')) {
            <span class="error-msg">Il cognome è obbligatorio</span>
          }
        </div>

        <div class="form-group">
          <label for="birthDate">Data di Nascita</label>
          <input
            id="birthDate"
            type="date"
            formControlName="birthDate"
            [class.invalid]="isInvalid('birthDate')"
          />
          @if (isInvalid('birthDate')) {
            <span class="error-msg">La data di nascita è obbligatoria</span>
          }
        </div>

        <div class="form-group">
          <label for="referenceContact">Contatto di Riferimento (Opzionale)</label>
          <input
            id="referenceContact"
            type="text"
            formControlName="referenceContact"
            placeholder="Es. Genitore, Email o Telefono"
          />
        </div>
      </div>

      <div class="form-group full-width">
        <label for="medicalNotes">Note Mediche (Opzionale)</label>
        <textarea
          id="medicalNotes"
          formControlName="medicalNotes"
          rows="3"
          placeholder="Es. Allergie, infortuni pregressi..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="athleteForm.invalid || isSubmitting()" class="btn-primary">
          @if (isSubmitting()) {
            Caricamento...
          } @else {
            Registra Atleta
          }
        </button>
      </div>
    </form>
  `,
  styles: `
    .athlete-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: var(--color-surface);
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
    }

    .form-grid {
      display: grid;
      grid-template-cols: 1fr;
      gap: 1.25rem;
    }

    @media (min-width: 768px) {
      .form-grid {
        grid-template-cols: 1fr 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    input, textarea {
      padding: 0.625rem;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--color-secondary-ao);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    input.invalid {
      border-color: var(--color-primary-aka);
    }

    .error-msg {
      font-size: 0.75rem;
      color: var(--color-primary-aka);
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    .btn-primary {
      background-color: var(--color-primary-aka);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `,
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

  protected isInvalid(controlName: string): boolean {
    const control = this.athleteForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  protected onSubmit(): void {
    if (this.athleteForm.valid) {
      this.save.emit(this.athleteForm.getRawValue());
    } else {
      this.athleteForm.markAllAsTouched();
    }
  }
}
