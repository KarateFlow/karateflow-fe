import '@angular/compiler';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AthleteListPage } from './athlete-list.page';
import { AthletesApiService } from '../../data-access/athletes-api.service';
import { AthleteCardListComponent } from '../../ui/athlete-card-list/athlete-card-list.component';
import { Athlete } from '../../data-access/athlete.model';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('AthleteListPage', () => {
  let component: AthleteListPage;
  let fixture: ComponentFixture<AthleteListPage>;
  let athletesApi: { getAthletes: Mock };

  const mockAthletes: Athlete[] = [
    { athleteId: '1', firstName: 'Mario', lastName: 'Rossi', birthDate: '2010-01-01', createdAt: '' },
    { athleteId: '2', firstName: 'Luigi', lastName: 'Verdi', birthDate: '2011-01-01', createdAt: '' }
  ];

  beforeEach(async () => {
    athletesApi = {
      getAthletes: vi.fn()
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AthleteListPage, AthleteCardListComponent],
      providers: [
        provideRouter([]),
        { provide: AthletesApiService, useValue: athletesApi }
      ]
    }).compileComponents();

    athletesApi.getAthletes.mockReturnValue(of(mockAthletes));
    fixture = TestBed.createComponent(AthleteListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load athletes on init', () => {
    expect(athletesApi.getAthletes).toHaveBeenCalled();
    expect(component['filteredAthletes']()).toEqual(mockAthletes);
  });

  it('should handle error during loading', async () => {
    athletesApi.getAthletes.mockReturnValue(timer(0).pipe(switchMap(() => throwError(() => new Error('API Error')))));
    
    component['store'].athletesResource.reload();
    
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['store'].athletesResource.error()).toBeDefined();
  });
});
