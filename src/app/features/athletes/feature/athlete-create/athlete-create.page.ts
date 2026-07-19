import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecordAthleteRequest } from '../../data-access/athlete.model';
import { AthleteStore } from '../../data-access/athlete.store';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { AthleteFormComponent } from '../../ui/athlete-form/athlete-form.component';

@Component({
  selector: 'app-athlete-create',
  imports: [AthleteFormComponent],
  templateUrl: './athlete-create.page.html',
  styleUrl: './athlete-create.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteCreatePage {
  private readonly store = inject(AthleteStore);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly isSubmitting = signal(false);

  protected async onSave(request: RecordAthleteRequest): Promise<void> {
    this.isSubmitting.set(true);
    try {
      const athlete = await this.store.createAthlete(request);
      this.isSubmitting.set(false);
      this.toastService.success(`Atleta ${athlete.firstName} ${athlete.lastName} registrato con successo!`);
      
      // Reindirizzamento ritardato per permettere di leggere il messaggio di successo
      setTimeout(() => {
        this.router.navigate(['/athletes']);
      }, 2000);
    } catch (err: unknown) {
      this.isSubmitting.set(false);
      this.toastService.error(this.store.getFormErrorMessage(err));
      console.error('Athlete creation failed', err);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/athletes']);
  }
}
