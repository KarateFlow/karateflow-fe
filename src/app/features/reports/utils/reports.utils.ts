import { ReportPreviewResponse, ExerciseTrend, TrendDataPoint } from '../data-access/reports.model';

export interface ReportSummaryStats {
  improved: number;
  worsened: number;
  stable: number;
  na: number;
  overallImprovement: number;
  hasValidData: boolean;
}

export function calculateReportSummaryStats(report: ReportPreviewResponse | null): ReportSummaryStats | null {
  if (!report) return null;

  let improved = 0;
  let worsened = 0;
  let stable = 0;
  let na = 0;
  let weightedImprovementSum = 0;
  let totalWeight = 0;
  let hasValidData = false;

  if (report.analysisType === 'COMPARISON') {
    const items = report.comparisonResults || [];
    items.forEach(c => {
      if (c.resultA === null || c.resultB === null || c.delta === 'N/A') {
        na++;
      } else {
        const deltaVal = parseFloat(c.delta);
        const pctVal = parseFloat(c.percentageChange);
        if (isNaN(deltaVal) || isNaN(pctVal)) {
          na++;
          return;
        }

        if (deltaVal === 0) {
          stable++;
        } else {
          const isImp = c.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
          if (isImp) {
            improved++;
          } else {
            worsened++;
          }
        }
        
        const impPct = c.greaterIsBetter ? pctVal : -pctVal;
        const weight = c.resultA;
        weightedImprovementSum += (weight * impPct);
        totalWeight += weight;
        hasValidData = true;
      }
    });
  } else {
    const trends = report.exerciseTrends || [];
    trends.forEach(t => {
      const pts = t.dataPoints || [];
      if (pts.length < 2) {
        na++;
      } else {
        const firstVal = pts[0].result;
        const lastVal = pts[pts.length - 1].result;
        const deltaVal = lastVal - firstVal;
        
        if (deltaVal === 0) {
          stable++;
        } else {
          const isImp = t.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
          if (isImp) {
            improved++;
          } else {
            worsened++;
          }
        }

        const pctVal = firstVal !== 0 ? (deltaVal / firstVal) * 100 : 0;
        const impPct = t.greaterIsBetter ? pctVal : -pctVal;
        const weight = firstVal;
        weightedImprovementSum += (weight * impPct);
        totalWeight += weight;
        hasValidData = true;
      }
    });
  }

  const overallImprovement = totalWeight > 0 ? (weightedImprovementSum / totalWeight) : 0;

  return {
    improved,
    worsened,
    stable,
    na,
    overallImprovement,
    hasValidData
  };
}

export function getTrendPeriodDirectly(report: ReportPreviewResponse): string {
  let start = report.startDate;
  let end = report.endDate;
  
  if (!start || !end) {
    const dates: Date[] = [];
    (report.exerciseTrends || []).forEach((t: ExerciseTrend) => {
      (t.dataPoints || []).forEach((dp: TrendDataPoint) => {
        dates.push(new Date(dp.date));
      });
    });
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      if (!start) start = dates[0].toISOString();
      if (!end) end = dates[dates.length - 1].toISOString();
    }
  }
  
  if (!start && !end) return 'N/D';
  
  const format = (dStr: string | undefined) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString('it-IT');
  };
  
  return `${start ? format(start) : 'Inizio'} - ${end ? format(end) : 'Fine'}`;
}

export function isPositive(deltaStr: string, greaterIsBetter: boolean): boolean {
  if (deltaStr === 'N/A') return false;
  const val = parseFloat(deltaStr);
  return greaterIsBetter ? val > 0 : val < 0;
}

export function isNegative(deltaStr: string, greaterIsBetter: boolean): boolean {
  if (deltaStr === 'N/A') return false;
  const val = parseFloat(deltaStr);
  return greaterIsBetter ? val < 0 : val > 0;
}

export function formatDeltaSign(deltaStr: string): string {
  if (deltaStr === 'N/A') return 'N/A';
  const val = parseFloat(deltaStr);
  if (isNaN(val)) return deltaStr;
  return val > 0 ? `+${deltaStr}` : deltaStr;
}

export function formatPctSign(pctStr: string): string {
  if (pctStr === 'N/A') return 'N/A';
  const val = parseFloat(pctStr);
  if (isNaN(val)) return pctStr;
  return val > 0 ? `+${pctStr}%` : `${pctStr}%`;
}
