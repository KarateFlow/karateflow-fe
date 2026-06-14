import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteDetailPage } from './athlete-detail.page';
import { provideRouter } from '@angular/router';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { of } from 'rxjs';
import { Athlete } from '../../data-access/athlete.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AthleteDetailPage', () => {
  let component: AthleteDetailPage;
  let fixture: ComponentFixture<AthleteDetailPage>;
  let mockAthletesApi: any;

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
    };

    await TestBed.configureTestingModule({
      imports: [AthleteDetailPage],
      providers: [
        provideRouter([
          { path: 'athletes/:id', component: AthleteDetailPage }
        ]),
        { provide: AthletesApiService, useValue: mockAthletesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
