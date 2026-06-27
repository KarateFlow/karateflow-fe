import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteCardListComponent } from './athlete-card-list.component';
import { Athlete } from '../../data-access/athlete.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AthleteCardListComponent', () => {
  let component: AthleteCardListComponent;
  let fixture: ComponentFixture<AthleteCardListComponent>;

  const mockAthletes: Athlete[] = [
    {
      athleteId: '123',
      firstName: 'Mario',
      lastName: 'Rossi',
      birthDate: '1990-01-01',
      referenceContact: '3331234567',
      medicalNotes: 'Nessuna',
      createdAt: '2023-01-01T10:00:00Z',
    },
    {
      athleteId: '456',
      firstName: 'Luigi',
      lastName: 'Verdi',
      birthDate: '1992-05-10',
      createdAt: '2023-02-01T10:00:00Z',
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AthleteCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteCardListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('athletes', mockAthletes);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display athletes list and their initials', () => {
    fixture.componentRef.setInput('athletes', mockAthletes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.athlete-card');
    expect(cards.length).toBe(2);

    expect(cards[0].querySelector('.athlete-name')?.textContent).toContain('Mario Rossi');
    expect(cards[0].querySelector('.initials')?.textContent).toBe('MR');

    expect(cards[1].querySelector('.athlete-name')?.textContent).toContain('Luigi Verdi');
    expect(cards[1].querySelector('.initials')?.textContent).toBe('LV');
  });

  it('should display empty state when athletes list is empty', () => {
    fixture.componentRef.setInput('athletes', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.athlete-card');
    expect(cards.length).toBe(0);

    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('Nessun atleta registrato');
  });

  it('should emit view output when card is clicked', () => {
    fixture.componentRef.setInput('athletes', mockAthletes);
    fixture.detectChanges();

    let emittedAthlete: Athlete | undefined;
    component.view.subscribe((athlete) => (emittedAthlete = athlete));

    const card = fixture.nativeElement.querySelector('.athlete-card');
    card.click();

    expect(emittedAthlete).toEqual(mockAthletes[0]);
  });

  it('should emit view output when Enter or Space is pressed on card', () => {
    fixture.componentRef.setInput('athletes', mockAthletes);
    fixture.detectChanges();

    let emittedAthlete: Athlete | undefined;
    component.view.subscribe((athlete) => (emittedAthlete = athlete));

    const card = fixture.nativeElement.querySelector('.athlete-card') as HTMLElement;
    
    // Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    card.dispatchEvent(enterEvent);
    expect(emittedAthlete).toEqual(mockAthletes[0]);

    // Reset
    emittedAthlete = undefined;

    // Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    card.dispatchEvent(spaceEvent);
    expect(emittedAthlete).toEqual(mockAthletes[0]);
  });
});
