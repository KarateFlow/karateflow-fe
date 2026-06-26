import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteTestsListComponent } from './athlete-tests-list.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementUnit } from '../../data-access/test.model';
import { provideRouter } from '@angular/router';

describe('AthleteTestsListComponent', () => {
  let component: AthleteTestsListComponent;
  let fixture: ComponentFixture<AthleteTestsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AthleteTestsListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteTestsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('tests', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show empty state message when no tests are provided', () => {
    fixture.componentRef.setInput('tests', []);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-history')).toBeTruthy();
    expect(compiled.textContent).toContain('Nessuna sessione di test registrata');
  });

  it('should render a list of tests', () => {
    fixture.componentRef.setInput('tests', [
      {
        id: '1',
        athleteId: 'a1',
        executionDate: '2023-01-01T10:00:00Z',
        type: 'Test Forza',
        exercises: [
          { exerciseTitle: 'Pushup', result: 20, unit: MeasurementUnit.COUNT, greaterIsBetter: true }
        ],
        createdAt: '2023-01-01T11:00:00Z'
      }
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.session-card').length).toBe(1);
    expect(compiled.textContent).toContain('Test Forza');
    expect(compiled.textContent).toContain('1 esercizi svolti');
  });

  it('should toggle expansion when clicking a session summary', () => {
    fixture.componentRef.setInput('tests', [
      {
        id: '1',
        athleteId: 'a1',
        executionDate: '2023-01-01T10:00:00Z',
        type: 'Test Forza',
        exercises: [],
        createdAt: '2023-01-01T11:00:00Z'
      }
    ]);
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('.session-summary') as HTMLElement;
    summary.click();
    fixture.detectChanges();

    expect(component['expandedId']()).toBe('1');
    expect(fixture.nativeElement.querySelector('.session-detail')).toBeTruthy();

    summary.click();
    fixture.detectChanges();
    expect(component['expandedId']()).toBeNull();
  });
});
