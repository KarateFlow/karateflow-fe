import { ChangeDetectionStrategy, Component, inject, signal, computed, OnDestroy, DestroyRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TemplateStore } from '../../data-access/template.store';
import { CreateTestTemplateRequest, MeasurementUnit, TestTemplateResponse, UpdateTestTemplateRequest } from '../../data-access/test.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbService } from '../../../../shared/components/breadcrumbs/breadcrumb.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiSelectComponent } from '../../../../shared/ui/ui-select/ui-select.component';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgClass, ConfirmDialogComponent, EmptyStateComponent, UiButtonComponent, UiInputComponent, UiSelectComponent],
  templateUrl: './templates-list.page.html',
  styleUrl: './templates-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListPage implements OnDestroy {
  private readonly templateStore = inject(TemplateStore);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.breadcrumbService.routeClicked
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(url => {
        if (url === '/templates') {
          this.cancel();
          this.closeDetail();
        }
      });
  }

  protected readonly isEditing = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isViewingDetail = signal(false);
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  protected readonly selectedTemplateId = signal<string | null>(null);
  protected readonly selectedTemplate = signal<TestTemplateResponse | null>(null);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly showSaveConfirm = signal(false);

  private templateIdToEdit: string | null = null;
  private templateIdToDelete: string | null = null;

  protected readonly templatesResource = this.templateStore.templatesResource;

  protected readonly searchTerm = signal<string>('');

  protected readonly filteredTemplates = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const templates = this.templatesResource.value() ?? [];
    if (!term) return templates;
    return templates.filter(t => t.name.toLowerCase().includes(term));
  });

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  protected readonly units = Object.values(MeasurementUnit);

  protected readonly templateForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(''),
    exercises: new FormArray([], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get exercises(): FormArray {
    return this.templateForm.get('exercises') as FormArray;
  }

  protected asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.templateForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected isControlInvalid(ctrl: AbstractControl, controlName: string): boolean {
    const control = ctrl.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected confirmDeleteCurrent(): void {
    const id = this.selectedTemplate()?.id || this.templateIdToEdit;
    if (id) {
      this.confirmDelete(id);
    }
  }

  protected viewDetail(template: TestTemplateResponse): void {
    this.selectedTemplate.set(template);
    this.isViewingDetail.set(true);
    this.isEditing.set(false);
    this.isCreating.set(false);
    this.breadcrumbService.setExtraCrumbs([{ label: template.name }]);
  }

  protected closeDetail(): void {
    this.isViewingDetail.set(false);
    this.selectedTemplate.set(null);
    this.breadcrumbService.clearExtraCrumbs();
  }

  protected startCreate(): void {
    this.templateForm.reset();
    this.exercises.clear();
    this.addExercise(); // Start with one empty exercise row
    this.isCreating.set(true);
    this.isEditing.set(false);
    this.breadcrumbService.setExtraCrumbs([{ label: 'Nuovo' }]);
  }

  protected startEdit(template: TestTemplateResponse): void {
    this.templateForm.patchValue({
      name: template.name,
      description: template.description || ''
    });

    this.exercises.clear();
    template.exercises.forEach(ex => {
      this.exercises.push(new FormGroup({
        exerciseTitle: new FormControl(ex.exerciseTitle, { nonNullable: true, validators: [Validators.required] }),
        unit: new FormControl(ex.unit, { nonNullable: true, validators: [Validators.required] }),
        greaterIsBetter: new FormControl(ex.greaterIsBetter, { nonNullable: true, validators: [Validators.required] }),
      }));
    });

    this.templateIdToEdit = template.id;
    this.isEditing.set(true);
    this.isCreating.set(false);
    this.breadcrumbService.setExtraCrumbs([
      { 
        label: template.name, 
        action: () => {
          this.isEditing.set(false);
          this.isViewingDetail.set(true);
          this.breadcrumbService.setExtraCrumbs([{ label: template.name }]);
        }
      }, 
      { label: 'Modifica' }
    ]);
  }

  protected addExercise(): void {
    const exerciseGroup = new FormGroup({
      exerciseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
    const newTitle = match ? `${match[1]} #${parseInt(match[2], 10) + 1}` : (title ? `${title} #2` : '');

    const duplicate = new FormGroup({
      exerciseTitle: new FormControl(newTitle, { nonNullable: true, validators: [Validators.required] }),
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

  protected cancel(): void {
    this.isCreating.set(false);
    this.isEditing.set(false);
    this.templateIdToEdit = null;
    this.templateForm.reset();
    if (this.isViewingDetail() && this.selectedTemplate()) {
      this.breadcrumbService.setExtraCrumbs([{ label: this.selectedTemplate()!.name }]);
    } else {
      this.breadcrumbService.clearExtraCrumbs();
    }
  }

  protected confirmDelete(templateId: string): void {
    this.templateIdToDelete = templateId;
    this.showDeleteConfirm.set(true);
  }

  protected async onConfirmDelete(): Promise<void> {
    this.showDeleteConfirm.set(false);
    if (!this.templateIdToDelete) return;

    try {
      await this.templateStore.deleteTemplate(this.templateIdToDelete);
      this.toastService.success('Template eliminato con successo!');
      this.selectedTemplateId.set(null);
      this.selectedTemplate.set(null);
      this.isViewingDetail.set(false);
      this.isEditing.set(false);
      this.templateIdToDelete = null;
      this.breadcrumbService.clearExtraCrumbs();
    } catch (error) {
      this.toastService.error(this.templateStore.getErrorMessage(error));
      console.error('Template operation failed', error);
    }
  }

  protected onPreSubmitSave(): void {
    if (this.templateForm.valid) {
      this.showSaveConfirm.set(true);
    } else {
      this.templateForm.markAllAsTouched();
      this.exercises.markAllAsTouched();
    }
  }

  protected async onConfirmSave(): Promise<void> {
    this.showSaveConfirm.set(false);
    this.isSaving.set(true);

    try {
      const payload = this.templateForm.getRawValue();
      if (this.isCreating()) {
        await this.templateStore.createTemplate(payload as CreateTestTemplateRequest);
        this.toastService.success('Template creato con successo!');
        this.isCreating.set(false);
      } else if (this.isEditing() && this.templateIdToEdit) {
        await this.templateStore.updateTemplate(this.templateIdToEdit, payload as UpdateTestTemplateRequest);
        this.toastService.success('Template aggiornato con successo!');
        const savedTemplate: TestTemplateResponse = {
          id: this.templateIdToEdit,
          name: payload.name,
          description: payload.description || undefined,
          exercises: (payload.exercises as { exerciseTitle: string; unit: MeasurementUnit; greaterIsBetter: boolean }[]).map(ex => ({
            exerciseTitle: ex.exerciseTitle,
            unit: ex.unit,
            greaterIsBetter: ex.greaterIsBetter
          })),
          createdAt: this.selectedTemplate()?.createdAt || new Date().toISOString()
        };
        this.selectedTemplate.set(savedTemplate);
        this.isEditing.set(false);
        this.breadcrumbService.setExtraCrumbs([{ label: savedTemplate.name }]);
      }
      this.templateIdToEdit = null;
    } catch (error) {
      this.toastService.error(this.templateStore.getErrorMessage(error));
      console.error('Template operation failed', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  ngOnDestroy(): void {
    this.breadcrumbService.clearExtraCrumbs();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isUserTyping(event)) return;

    if (event.key === '/') {
      if (!this.isEditing() && !this.isCreating() && !this.isViewingDetail()) {
        event.preventDefault();
        this.searchInput?.nativeElement.focus();
      }
    } else if (event.key.toLowerCase() === 'c') {
      if (!this.isEditing() && !this.isCreating() && !this.isViewingDetail()) {
        event.preventDefault();
        this.startCreate();
      }
    } else if (event.key === 'Escape') {
      if (this.isEditing() || this.isCreating()) {
        event.preventDefault();
        this.cancel();
      } else if (this.isViewingDetail()) {
        event.preventDefault();
        this.closeDetail();
      }
    }
  }

  private isUserTyping(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }
}
