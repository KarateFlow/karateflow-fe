import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// API calls will be intercepted by api.interceptor.ts
import { Athlete, RecordAthleteRequest, UpdateAthleteRequest } from './athlete.model';

@Injectable({
  providedIn: 'root',
})
export class AthletesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `/athletes`;

  /**
   * Retrieves the list of all athletes in the system.
   * @returns An Observable of the list of Athletes.
   */
  getAthletes(): Observable<Athlete[]> {
    return this.http.get<Athlete[]>(this.apiUrl);
  }

  /**
   * Retrieves a single athlete by their unique identifier.
   * @param athleteId The unique ID of the athlete to retrieve.
   * @returns An Observable of the retrieved Athlete.
   */
  getAthlete(athleteId: string): Observable<Athlete> {
    return this.http.get<Athlete>(`${this.apiUrl}/${athleteId}`);
  }

  /**
   * Creates a new athlete in the system.
   * @param request The data required to record a new athlete.
   * @returns An Observable of the created Athlete.
   */
  createAthlete(request: RecordAthleteRequest): Observable<Athlete> {
    return this.http.post<Athlete>(this.apiUrl, request);
  }

  /**
   * Updates an existing athlete's contact and medical information.
   * @param athleteId The unique ID of the athlete to update.
   * @param request The data to update.
   * @returns An Observable of the updated Athlete.
   */
  updateAthlete(athleteId: string, request: UpdateAthleteRequest): Observable<Athlete> {
    return this.http.put<Athlete>(`${this.apiUrl}/${athleteId}`, request);
  }
}
