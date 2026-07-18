import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecordAthleteRequest } from '../../data-access/athlete.model';

@Component({
  selector: 'app-athlete-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="athleteForm" (ngSubmit)="onSubmit()" class="athlete-form">
      <div class="avatar-section">
        <label for="avatarUpload" class="avatar-upload-label">
          @if (avatarPreview()) {
            <img [src]="avatarPreview()" alt="Avatar Preview" class="avatar-image" />
            <div class="hover-overlay">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          } @else {
            <div class="avatar-placeholder">
              <span class="initials">{{ getInitials() }}</span>
              <div class="hover-overlay">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
            </div>
          }
          <input type="file" id="avatarUpload" accept="image/*" class="hidden-input" (change)="onFileSelected($event)" />
        </label>
        <div class="avatar-hint">
          <p class="font-bold">Foto Profilo</p>
          <p class="text-sm">Clicca per caricare un'immagine. (Anteprima locale)</p>
        </div>
      </div>

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
      border: 1px solid var(--color-border);
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .avatar-upload-label {
      position: relative;
      display: inline-block;
      cursor: pointer;
      border-radius: 50%;
      overflow: hidden;
      width: 80px;
      height: 80px;
      border: 2px dashed var(--color-border);
      transition: all 0.2s;
    }

    .avatar-upload-label:hover {
      border-color: var(--color-primary-aka);
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-aka);
      font-weight: 700;
      font-size: 1.5rem;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .avatar-upload-label:hover .hover-overlay {
      opacity: 1;
    }

    .hidden-input {
      display: none;
    }

    .avatar-hint p {
      margin: 0;
      color: var(--color-text-muted);
    }

    .avatar-hint .font-bold {
      color: var(--color-text-main);
      margin-bottom: 0.25rem;
    }

    .avatar-hint .text-sm {
      font-size: 0.875rem;
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
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      font-family: inherit;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--color-primary-aka);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    input.invalid {
      border-color: var(--color-secondary-ao);
    }

    .error-msg {
      font-size: 0.75rem;
      color: var(--color-secondary-ao);
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
      border-radius: var(--radius-xl);
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
