export interface Athlete {
  athleteId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  referenceContact?: string;
  medicalNotes?: string;
  createdAt: string;
}

export interface RecordAthleteRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  referenceContact?: string;
  medicalNotes?: string;
}
