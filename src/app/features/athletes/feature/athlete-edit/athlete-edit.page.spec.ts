import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteEditPage } from './athlete-edit.page';
import { provideRouter } from '@angular/router';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { of } from 'rxjs';
import { Athlete } from '../../data-access/athlete.model';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AthleteEditPage', () => {
  let component: AthleteEditPage;
  let fixture: ComponentFixture<AthleteEditPage>;
  let mockAthletesApi: { getAthlete: Mock; updateAthlete: Mock };

  const mockAthlete: Athlete = {
    athleteId: '123',
    firstName: 'Mario',
    lastName: 'Rossi',
    birthDate: '1990-01-01',
    referenceContact: '3331234567',
    medicalNotes: 'Nessuna',
    createdAt: '2023-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockAthletesApi = {
      getAthlete: vi.fn().mockReturnValue(of(mockAthlete)),
      updateAthlete: vi.fn().mockReturnValue(of(mockAthlete)),
    };

    await TestBed.configureTestingModule({
      imports: [AthleteEditPage],
      providers: [
        provideRouter([
          { path: 'athletes/:id/edit', component: AthleteEditPage }
        ]),
        { provide: AthletesApiService, useValue: mockAthletesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteEditPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
