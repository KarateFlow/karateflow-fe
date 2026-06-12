import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AthleteFormComponent } from './athlete-form.component';

// Inizializzazione ambiente test se non già fatto (Vitest può eseguire file in parallelo)
try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Environment già inizializzato
}

describe('AthleteFormComponent', () => {
  let component: AthleteFormComponent;
  let fixture: ComponentFixture<AthleteFormComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AthleteFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when empty', () => {
    expect(component['athleteForm'].valid).toBe(false);
  });

  it('should validate required fields', () => {
    const form = component['athleteForm'];
    const firstName = form.get('firstName');
    const lastName = form.get('lastName');
    const birthDate = form.get('birthDate');

    firstName?.setValue('');
    lastName?.setValue('');
    birthDate?.setValue('');

    expect(firstName?.valid).toBe(false);
    expect(lastName?.valid).toBe(false);
    expect(birthDate?.valid).toBe(false);
  });

  it('should emit save event when form is valid and submitted', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);

    component['athleteForm'].patchValue({
      firstName: 'Bruce',
      lastName: 'Lee',
      birthDate: '1940-11-27',
      referenceContact: 'Jeet Kune Do',
      medicalNotes: 'Be water, my friend'
    });

    component['onSubmit']();

    expect(spy).toHaveBeenCalledWith({
      firstName: 'Bruce',
      lastName: 'Lee',
      birthDate: '1940-11-27',
      referenceContact: 'Jeet Kune Do',
      medicalNotes: 'Be water, my friend'
    });
  });

  it('should show error messages only when touched', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Inizialmente nessun errore
    expect(compiled.querySelector('.error-msg')).toBeNull();

    // Forza validazione senza touch
    component['athleteForm'].get('firstName')?.setValue('');
    fixture.detectChanges();
    expect(compiled.querySelector('.error-msg')).toBeNull();

    // Touch field
    component['athleteForm'].get('firstName')?.markAsTouched();
    fixture.detectChanges();
    expect(compiled.querySelector('.error-msg')).not.toBeNull();
    expect(compiled.querySelector('.error-msg')?.textContent).toContain('Il nome è obbligatorio');
  });

  it('should disable button when form is invalid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    expect(submitBtn.disabled).toBe(true);

    component['athleteForm'].patchValue({
      firstName: 'Chuck',
      lastName: 'Norris',
      birthDate: '1940-03-10'
    });
    fixture.detectChanges();

    expect(submitBtn.disabled).toBe(false);
  });
});
