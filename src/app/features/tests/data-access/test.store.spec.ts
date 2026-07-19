import { TestBed } from '@angular/core/testing';
import { TestStore } from './test.store';
import { TestsApiService } from './tests-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TestStore', () => {
  let store: TestStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any;

  beforeEach(() => {
    apiMock = {
      getTest: vi.fn().mockReturnValue(of({ id: '123' })),
      getTestsByAthlete: vi.fn().mockReturnValue(of([])),
      createTest: vi.fn().mockReturnValue(of({ id: 'new' })),
      updateTest: vi.fn().mockReturnValue(of({ id: '123' })),
      deleteTest: vi.fn().mockReturnValue(of(null)),
    };

    TestBed.configureTestingModule({
      providers: [
        TestStore,
        { provide: TestsApiService, useValue: apiMock }
      ]
    });

    store = TestBed.inject(TestStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should select test and athlete', () => {
    store.selectTest('123');
    expect(store.selectedTestId()).toBe('123');
    
    store.selectAthlete('athlete1');
    expect(store.selectedAthleteId()).toBe('athlete1');
  });

  it('should create test', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await store.createTest({} as any);
    expect(apiMock.createTest).toHaveBeenCalled();
    expect(result.id).toBe('new');
  });

  it('should update test', async () => {
    store.selectTest('123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await store.updateTest('123', {} as any);
    expect(apiMock.updateTest).toHaveBeenCalled();
    expect(result.id).toBe('123');
  });

  it('should delete test', async () => {
    await store.deleteTest('123');
    expect(apiMock.deleteTest).toHaveBeenCalledWith('123');
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
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 400 }))).toContain('non sono validi');
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 404 }))).toContain('non sono disponibili');
    expect(store.getErrorMessage(new HttpErrorResponse({ status: 500 }))).toContain('problema interno');
    expect(store.getErrorMessage(new Error())).toContain('errore inaspettato durante');
  });
});
