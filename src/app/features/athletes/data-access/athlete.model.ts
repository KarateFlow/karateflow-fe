export interface Athlete {
  athleteId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  referenceContact?: string | null;
  medicalNotes?: string | null;
  createdAt: string;
}

export interface RecordAthleteRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  referenceContact?: string | null;
  medicalNotes?: string | null;
}
