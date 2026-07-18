import { Athlete } from '../../athletes/data-access/athlete.model';
import { ReportResponse } from '../../reports/data-access/reports.model';

export function getAthleteName(athleteId: string, athletes: Athlete[] | undefined): string {
  if (!athletes) return 'Atleta sconosciuto';
  const athlete = athletes.find(a => a.athleteId === athleteId);
  return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atleta sconosciuto';
}

export function getTrendDates(report: ReportResponse): { start: string | undefined, end: string | undefined } {
  if (report.payload.startDate && report.payload.endDate) {
    return { start: report.payload.startDate, end: report.payload.endDate };
  }

  let start: string | undefined;
  let end: string | undefined;

  if (report.payload.exerciseTrends?.length) {
    report.payload.exerciseTrends.forEach(trend => {
      if (trend.dataPoints?.length) {
        const firstDate = trend.dataPoints[0].date;
        const lastDate = trend.dataPoints[trend.dataPoints.length - 1].date;
        if (!start || new Date(firstDate) < new Date(start)) {
          start = firstDate;
        }
        if (!end || new Date(lastDate) > new Date(end)) {
          end = lastDate;
        }
      }
    });
  }

  return { start, end };
}

export function getOverallImprovement(report: ReportResponse): { value: number, text: string, isPositive: boolean } | null {
  let percentages: number[] = [];

  if (report.payload.analysisType === 'COMPARISON') {
    if (!report.payload.comparisonResults?.length) return null;
    const validResults = report.payload.comparisonResults.filter(r => r.percentageChange && r.percentageChange !== 'N/A');
    percentages = validResults.map(r => parseFloat(r.percentageChange));
  } else if (report.payload.analysisType === 'TREND') {
    if (!report.payload.exerciseTrends?.length) return null;
    report.payload.exerciseTrends.forEach(trend => {
      if (trend.dataPoints && trend.dataPoints.length > 1) {
        const first = trend.dataPoints[0].result;
        const last = trend.dataPoints[trend.dataPoints.length - 1].result;
        if (first !== 0) {
          let change = ((last - first) / first) * 100;
          if (!trend.greaterIsBetter) {
            change = -change;
          }
          percentages.push(change);
        }
      }
    });
  }

  if (percentages.length === 0) return null;
  
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  const avg = sum / percentages.length;
  
  return {
    value: avg,
    text: avg > 0 ? `+${avg.toFixed(1)}%` : `${avg.toFixed(1)}%`,
    isPositive: avg > 0
  };
}
