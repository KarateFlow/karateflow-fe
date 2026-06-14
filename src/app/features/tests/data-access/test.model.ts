export enum MeasurementUnit {
  KG = 'KG',
  SEC = 'SEC',
  CM = 'CM',
  COUNT = 'COUNT',
}

export interface PerformedExerciseRequest {
  exerciseTitle: string;
  result: number;
  unit: MeasurementUnit;
  greaterIsBetter: boolean;
}

export interface CreateTestRequest {
  athleteId: string;
  executionDate: string;
  type?: string;
  coachNotes?: string;
  exercises: PerformedExerciseRequest[];
}

export interface TestResponse {
  id: string;
  athleteId: string;
  executionDate: string;
  type?: string;
  coachNotes?: string;
  exercises: {
    exerciseTitle: string;
    result: number;
    unit: MeasurementUnit;
    greaterIsBetter: boolean;
  }[];
  createdAt: string;
}
