import { TestBed } from '@angular/core/testing';
import { AthleteStore } from './athlete.store';
import { AthletesApiService } from './athletes-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AthleteStore', () => {
  let store: AthleteStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any;

  beforeEach(() => {
    apiMock = {
      getAthletes: vi.fn().mockReturnValue(of([])),
      getAthlete: vi.fn().mockReturnValue(of({ athleteId: '123' })),
      createAthlete: vi.fn().mockReturnValue(of({ athleteId: 'new' })),
      updateAthlete: vi.fn().mockReturnValue(of({ athleteId: '123' })),
    };

    TestBed.configureTestingModule({
      providers: [
        AthleteStore,
        { provide: AthletesApiService, useValue: apiMock }
      ]
    });

    store = TestBed.inject(AthleteStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should select athlete', () => {
    store.selectAthlete('123');
    expect(store.selectedAthleteId()).toBe('123');
  });

  it('should create athlete', async () => {
    const result = await store.createAthlete({});
    expect(apiMock.createAthlete).toHaveBeenCalled();
    expect(result.athleteId).toBe('new');
  });

  it('should update athlete', async () => {
    store.selectAthlete('123');
    const result = await store.updateAthlete('123', {});
    expect(apiMock.updateAthlete).toHaveBeenCalled();
    expect(result.athleteId).toBe('123');
  });

  it('getErrorTitle should return correct titles', () => {
    expect(store.getErrorTitle(new HttpErrorResponse({ status: 0 }))).toBe('Connessione Fallita');
    expect(store.getErrorTitle(new HttpErrorResponse({ status: 404 }))).toBe('Risorsa non Trovata');
    expect(store.getErrorTitle(new HttpErrorResponse({ status: 403 }))).toBe('Accesso Negato');
    expect(store.getErrorTitle(new HttpErrorResponse({ status: 500 }))).toBe('Errore del Server (500)');
    expect(store.getErrorTitle(new Error())).toBe('Errore Inaspettato');
  });

  it('getErrorMessage should return correct messages', () => {
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Impossibile raggiungere');
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 404 }))).toContain('non sono disponibili');
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 500 }))).toContain('problema interno');
    expect(store.getErrorMessage(new Error())).toContain('errore durante il recupero');
  });

  it('getFormErrorMessage should return correct messages', () => {
    expect(store.getFormErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Errore di connessione');
    expect(store.getFormErrorMessage(new HttpErrorResponse({ status: 400 }))).toContain('non sono validi');
    expect(store.getFormErrorMessage(new HttpErrorResponse({ status: 409 }))).toContain('già registrato');
    expect(store.getFormErrorMessage(new HttpErrorResponse({ status: 500 }))).toContain('Errore del server');
    expect(store.getFormErrorMessage(new Error())).toContain('errore inaspettato');
  });
});
