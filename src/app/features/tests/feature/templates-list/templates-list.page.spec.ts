/* eslint-disable @typescript-eslint/no-explicit-any */
import '@angular/compiler';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { TemplatesListPage } from './templates-list.page';
import { TemplatesApiService } from '../../data-access/templates-api.service';
import { MeasurementUnit, TestTemplateResponse } from '../../data-access/test.model';
import { HttpErrorResponse } from '@angular/common/http';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignore multiple initialization errors
}

describe('TemplatesListPage', () => {
  let component: TemplatesListPage;
  let fixture: ComponentFixture<TemplatesListPage>;
  let templatesApi: {
    getTemplates: Mock;
    createTemplate: Mock;
    updateTemplate: Mock;
    deleteTemplate: Mock;
  };

  const mockTemplates: TestTemplateResponse[] = [
    {
      id: 't-1',
      name: 'Template Uno',
      description: 'Descrizione Uno',
      createdAt: '2026-06-26T12:00:00Z',
      exercises: [
        { exerciseTitle: 'Squat', unit: MeasurementUnit.KG, greaterIsBetter: true }
      ]
    },
    {
      id: 't-2',
      name: 'Template Due',
      description: 'Descrizione Due',
      createdAt: '2026-06-26T13:00:00Z',
      exercises: [
        { exerciseTitle: 'Plank', unit: MeasurementUnit.SEC, greaterIsBetter: true }
      ]
    }
  ];

  beforeEach(async () => {
    templatesApi = {
      getTemplates: vi.fn(),
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn()
    };

    templatesApi.getTemplates.mockReturnValue(of(mockTemplates));

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TemplatesListPage],
      providers: [
        provideRouter([]),
        { provide: TemplatesApiService, useValue: templatesApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TemplatesListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load templates on init', () => {
    expect(templatesApi.getTemplates).toHaveBeenCalled();
    expect((component as any).templatesResource.value()).toEqual(mockTemplates);
  });

  it('should call confirmDelete with selectedTemplate id when confirmDeleteCurrent is called', () => {
    const confirmDeleteSpy = vi.spyOn(component as any, 'confirmDelete');
    (component as any).selectedTemplate.set(mockTemplates[0]);
    (component as any).confirmDeleteCurrent();
    expect(confirmDeleteSpy).toHaveBeenCalledWith('t-1');
  });

  it('should set selectedTemplate and isViewingDetail when viewDetail is called', () => {
    (component as any).viewDetail(mockTemplates[0]);
    expect((component as any).isViewingDetail()).toBe(true);
    expect((component as any).selectedTemplate()).toEqual(mockTemplates[0]);
  });

  it('should clear selectedTemplate and set isViewingDetail to false when closeDetail is called', () => {
    (component as any).viewDetail(mockTemplates[0]);
    (component as any).closeDetail();
    expect((component as any).isViewingDetail()).toBe(false);
    expect((component as any).selectedTemplate()).toBeNull();
  });

  it('should set error state if templates fail to load', async () => {
    templatesApi.getTemplates.mockReturnValue(throwError(() => new Error('API Error')));
    
    (component as any).templatesResource.reload();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((component as any).templatesResource.error()).toBeDefined();
  });

  it('should enter creation mode and initialize form', () => {
    // @ts-expect-error - accessing protected method
    component.startCreate();

    // @ts-expect-error - accessing protected field
    expect(component.isCreating()).toBe(true);
    // @ts-expect-error - accessing protected field
    expect(component.isEditing()).toBe(false);
    
    // Should initialize with 1 empty exercise row
    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value).toEqual({
      exerciseTitle: '',
      unit: MeasurementUnit.CM,
      greaterIsBetter: true
    });
  });

  it('should enter edit mode and load template data', () => {
    const templateToEdit = mockTemplates[0];
    
    // @ts-expect-error - accessing protected method
    component.startEdit(templateToEdit);

    // @ts-expect-error - accessing protected field
    expect(component.isEditing()).toBe(true);
    // @ts-expect-error - accessing protected field
    expect(component.isCreating()).toBe(false);

    // @ts-expect-error - accessing protected field
    expect(component.templateForm.value.name).toBe(templateToEdit.name);
    // @ts-expect-error - accessing protected field
    expect(component.templateForm.value.description).toBe(templateToEdit.description);
    expect(component.exercises.length).toBe(1);
    expect(component.exercises.at(0).value).toEqual({
      exerciseTitle: 'Squat',
      unit: MeasurementUnit.KG,
      greaterIsBetter: true
    });
  });

  it('should add, duplicate and remove exercise rows', () => {
    // @ts-expect-error - accessing protected method
    component.startCreate(); // starts with 1 exercise
    
    // @ts-expect-error - accessing protected method
    component.addExercise(); // adds another
    expect(component.exercises.length).toBe(2);

    // Set first exercise title
    component.exercises.at(0).patchValue({ exerciseTitle: 'Push Up' });

    // @ts-expect-error - accessing protected method
    component.duplicateExercise(0); // duplicates first exercise
    expect(component.exercises.length).toBe(3);
    expect(component.exercises.at(2).value).toEqual({
      exerciseTitle: 'Push Up #2',
      unit: MeasurementUnit.CM,
      greaterIsBetter: true
    });

    // @ts-expect-error - accessing protected method
    component.removeExercise(1); // removes second exercise
    expect(component.exercises.length).toBe(2);
  });

  it('should show save confirm dialog when form is valid', () => {
    // @ts-expect-error - accessing protected method
    component.startCreate();
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Nuovo Template' });
    component.exercises.at(0).patchValue({ exerciseTitle: 'Esercizio A' });

    // @ts-expect-error - accessing protected method
    component.onPreSubmitSave();

    // @ts-expect-error - accessing protected field
    expect(component.showSaveConfirm()).toBe(true);
  });

  it('should mark all fields as touched if form is invalid', () => {
    // @ts-expect-error - accessing protected method
    component.startCreate();
    // Form is invalid because template name and exercise title are empty

    // @ts-expect-error - accessing protected method
    component.onPreSubmitSave();

    // @ts-expect-error - accessing protected field
    expect(component.showSaveConfirm()).toBe(false);
    // @ts-expect-error - accessing protected field
    expect(component.templateForm.touched).toBe(true);
  });

  it('should call createTemplate when confirmed in creation mode', async () => {
    templatesApi.createTemplate.mockReturnValue(of({}));
    const reloadSpy = vi.spyOn((component as any).templatesResource, 'reload');

    // @ts-expect-error - accessing protected method
    component.startCreate();
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Nuovo Template', description: 'Desc' });
    component.exercises.at(0).patchValue({ exerciseTitle: 'Esercizio A' });

    // @ts-expect-error - accessing protected method
    await component.onConfirmSave();

    expect(templatesApi.createTemplate).toHaveBeenCalledWith({
      name: 'Nuovo Template',
      description: 'Desc',
      exercises: [
        { exerciseTitle: 'Esercizio A', unit: MeasurementUnit.CM, greaterIsBetter: true }
      ]
    });
    expect(reloadSpy).toHaveBeenCalled();
    // @ts-expect-error - accessing protected field
    expect(component.isCreating()).toBe(false);
  });

  it('should call updateTemplate when confirmed in edit mode', async () => {
    templatesApi.updateTemplate.mockReturnValue(of({}));
    const reloadSpy = vi.spyOn((component as any).templatesResource, 'reload');

    const templateToEdit = mockTemplates[0];
    // @ts-expect-error - accessing protected method
    component.startEdit(templateToEdit);
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Template Uno Aggiornato' });

    // @ts-expect-error - accessing protected method
    await component.onConfirmSave();

    expect(templatesApi.updateTemplate).toHaveBeenCalledWith('t-1', {
      name: 'Template Uno Aggiornato',
      description: 'Descrizione Uno',
      exercises: [
        { exerciseTitle: 'Squat', unit: MeasurementUnit.KG, greaterIsBetter: true }
      ]
    });
    expect(reloadSpy).toHaveBeenCalled();
    // @ts-expect-error - accessing protected field
    expect(component.isEditing()).toBe(false);
  });

  it('should call deleteTemplate when confirmed', async () => {
    templatesApi.deleteTemplate.mockReturnValue(of({}));
    const reloadSpy = vi.spyOn((component as any).templatesResource, 'reload');

    // @ts-expect-error - accessing protected method
    component.confirmDelete('t-1');
    // @ts-expect-error - accessing protected method
    await component.onConfirmDelete();

    expect(templatesApi.deleteTemplate).toHaveBeenCalledWith('t-1');
    expect(reloadSpy).toHaveBeenCalled();
    // @ts-expect-error - accessing protected field
    expect(component.selectedTemplateId()).toBeNull();
  });

  it('should handle HTTP error 400 when saving', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request'
    });
    templatesApi.createTemplate.mockReturnValue(throwError(() => errorResponse));

    // @ts-expect-error - accessing protected method
    component.startCreate();
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Invalid' });
    component.exercises.at(0).patchValue({ exerciseTitle: 'A' });

    // @ts-expect-error - accessing protected method
    await component.onConfirmSave();

    // @ts-expect-error - accessing protected field
    expect(component.errorMessage()).toBe('I dati inseriti non sono validi. Controlla i campi e riprova.');
  });

  it('should handle HTTP error 500 when saving', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error'
    });
    templatesApi.createTemplate.mockReturnValue(throwError(() => errorResponse));

    // @ts-expect-error - accessing protected method
    component.startCreate();
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Server Error' });
    component.exercises.at(0).patchValue({ exerciseTitle: 'A' });

    // @ts-expect-error - accessing protected method
    await component.onConfirmSave();

    // @ts-expect-error - accessing protected field
    expect(component.errorMessage()).toBe('Errore del server: si è verificato un problema interno.');
  });

  it('should handle connection errors (status 0)', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error'
    });
    templatesApi.createTemplate.mockReturnValue(throwError(() => errorResponse));

    // @ts-expect-error - accessing protected method
    component.startCreate();
    // @ts-expect-error - accessing protected field
    component.templateForm.patchValue({ name: 'Connection Error' });
    component.exercises.at(0).patchValue({ exerciseTitle: 'A' });

    // @ts-expect-error - accessing protected method
    await component.onConfirmSave();

    // @ts-expect-error - accessing protected field
    expect(component.errorMessage()).toBe('Errore di connessione: il server non risponde. Controlla la tua connessione internet.');
  });
});
