import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateTestRequest, TestResponse, UpdateTestRequest } from './test.model';

@Injectable({
  providedIn: 'root',
})
export class TestsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tests`;

  /**
   * Records a new physical test session.
   * @param request The test session data.
   * @returns An Observable of the recorded TestResponse.
   */
  createTest(request: CreateTestRequest): Observable<TestResponse> {
    return this.http.post<TestResponse>(this.apiUrl, request);
  }

  /**
   * Retrieves the test history for a specific athlete.
   * @param athleteId The unique ID of the athlete.
   * @returns An Observable of the list of TestResponses.
   */
  getTestsByAthlete(athleteId: string): Observable<TestResponse[]> {
    return this.http.get<TestResponse[]>(this.apiUrl, {
      params: { athleteId },
    });
  }

  /**
   * Retrieves a single test session by ID.
   * @param id The unique ID of the test session.
   * @returns An Observable of the TestResponse.
   */
  getTest(id: string): Observable<TestResponse> {
    return this.http.get<TestResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Updates an existing test session.
   * @param id The unique ID of the test session.
   * @param request The updated test session data.
   * @returns An Observable of the updated TestResponse.
   */
  updateTest(id: string, request: UpdateTestRequest): Observable<TestResponse> {
    return this.http.put<TestResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Deletes a test session.
   * @param id The unique ID of the test session.
   * @returns An Observable of void.
   */
  deleteTest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

