export interface ReportPreviewRequest {
  analysisType: 'COMPARISON' | 'TREND';
  athleteId: string;
  testIdA?: string;
  testIdB?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExerciseComparison {
  exerciseTitle: string;
  resultA: number | null;
  resultB: number | null;
  delta: string; // E.g. "5.00" or "N/A"
  percentageChange: string; // E.g. "25.00" or "N/A"
  unit: string;
  greaterIsBetter: boolean;
}

export interface TrendDataPoint {
  date: string;
  result: number;
}

export interface ExerciseTrend {
  exerciseTitle: string;
  unit: string;
  greaterIsBetter: boolean;
  dataPoints: TrendDataPoint[];
}

export interface ReportPreviewResponse {
  athleteId: string;
  analysisType: 'COMPARISON' | 'TREND';
  
  // Comparison fields (optional/nullable)
  testIdA?: string;
  testIdB?: string;
  lowOverlap?: boolean;
  overlapPercentage?: number;
  comparisonResults?: ExerciseComparison[];
  
  // Trend fields (optional/nullable)
  startDate?: string;
  endDate?: string;
  exerciseTrends?: ExerciseTrend[];
}
