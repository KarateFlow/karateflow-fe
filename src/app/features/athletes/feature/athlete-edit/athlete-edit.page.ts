import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AthleteStore } from '../../data-access/athlete.store';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DatePipe } from '@angular/common';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiTextareaComponent } from '../../../../shared/ui/ui-textarea/ui-textarea.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-athlete-edit',
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent, DatePipe, UiInputComponent, UiTextareaComponent, UiButtonComponent],
  templateUrl: './athlete-edit.page.html',
  styleUrl: './athlete-edit.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(AthleteStore);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastService = inject(ToastService);

  protected readonly athleteId = signal(this.route.snapshot.paramMap.get('id')!);
  protected readonly showConfirm = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly editForm = new FormGroup({
    referenceContact: new FormControl(''),
    medicalNotes: new FormControl(''),
  });

  protected get athlete() {
    if (this.store.selectedAthleteResource.error() || this.store.selectedAthleteResource.isLoading()) {
      return null;
    }
    return this.store.selectedAthleteResource.value();
  }
  
  protected get isLoading() {
    return this.store.selectedAthleteResource.isLoading();
  }
  
  protected get error() {
    return this.store.selectedAthleteResource.error();
  }

  constructor() {
    this.store.selectAthlete(this.athleteId());

    effect(() => {
      const athlete = this.athlete;
      if (athlete && !this.editForm.dirty) {
        this.breadcrumbService.setLabel(this.athleteId(), `${athlete.firstName} ${athlete.lastName}`);
        this.editForm.patchValue({
          referenceContact: athlete.referenceContact ?? '',
          medicalNotes: athlete.medicalNotes ?? '',
        });
      }
    });
  }

  protected onPreSubmit(): void {
    if (this.editForm.valid) {
      this.showConfirm.set(true);
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showConfirm.set(false);
    this.isSubmitting.set(true);

    try {
      const payload = {
        referenceContact: this.editForm.value.referenceContact,
        medicalNotes: this.editForm.value.medicalNotes,
      };

      await this.store.updateAthlete(this.athleteId(), payload);
      this.toastService.success('Dati aggiornati con successo!');
      this.router.navigate(['/athletes', this.athleteId()]);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      this.isSubmitting.set(false);
      this.toastService.error('Errore durante il salvataggio dei dati.');
    }
  }
}
