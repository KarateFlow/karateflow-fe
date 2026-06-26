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

export interface UpdateTestRequest {
  type?: string;
  coachNotes?: string;
  exercises: PerformedExerciseRequest[];
}

export interface TemplateExerciseRequest {
  exerciseTitle: string;
  unit: MeasurementUnit;
  greaterIsBetter: boolean;
}

export interface CreateTestTemplateRequest {
  name: string;
  description?: string;
  exercises: TemplateExerciseRequest[];
}

export interface UpdateTestTemplateRequest {
  name: string;
  description?: string;
  exercises: TemplateExerciseRequest[];
}

export interface TestTemplateResponse {
  id: string;
  name: string;
  description?: string;
  exercises: {
    exerciseTitle: string;
    unit: MeasurementUnit;
    greaterIsBetter: boolean;
  }[];
  createdAt: string;
}


