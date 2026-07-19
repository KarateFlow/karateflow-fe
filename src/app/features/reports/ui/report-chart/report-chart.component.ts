import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  date: Date;
  result: number;
}

export interface TrendLinePoint {
  x: number;
  y: number;
  value: number;
  date: Date;
  label: string;
  leftPct: number;
  hover?: boolean;
}

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-chart.component.html',
  styleUrl: './report-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportChartComponent {
  chartType = input<'bar' | 'line'>('bar');

  // Input for BAR type
  resultA = input<number | null>(null);
  resultB = input<number | null>(null);
  dateA = input<Date | string | null>(null);
  dateB = input<Date | string | null>(null);
  delta = input<string>('N/A');
  percentageChange = input<string>('N/A');
  unit = input<string>('');
  greaterIsBetter = input<boolean>(true);

  // Input for LINE type
  linePoints = input<ChartDataPoint[]>([]);

  // Computed properties for BAR chart height
  protected readonly barHeightA = computed(() => {
    const rA = this.resultA();
    const rB = this.resultB();
    if (rA === null) return 0;
    if (rB === null) return 100;
    const maxVal = Math.max(rA, rB);
    if (maxVal === 0) return 0;
    return (rA / maxVal) * 100;
  });

  protected readonly barHeightB = computed(() => {
    const rA = this.resultA();
    const rB = this.resultB();
    if (rB === null) return 0;
    if (rA === null) return 100;
    const maxVal = Math.max(rA, rB);
    if (maxVal === 0) return 0;
    return (rB / maxVal) * 100;
  });

  protected readonly isPositiveChange = computed(() => {
    const pct = parseFloat(this.percentageChange());
    if (isNaN(pct)) return true;
    // Check if the change is physically positive (i.e. better)
    const numericDelta = parseFloat(this.delta());
    if (isNaN(numericDelta)) return true;
    if (this.greaterIsBetter()) {
      return numericDelta >= 0;
    } else {
      return numericDelta <= 0;
    }
  });

  protected readonly deltaValFormatted = computed(() => {
    const d = this.delta();
    if (d === 'N/A') return 'N/A';
    const pct = this.percentageChange();
    const sign = parseFloat(d) >= 0 ? '+' : '';
    return `${sign}${d} (${sign}${pct}%)`;
  });

  // Computed properties for LINE chart SVG coordinates
  // Width: 440px (from x=40 to x=480)
  // Height: 180px (from y=20 to y=200)
  private readonly lineLimits = computed(() => {
    const pts = this.linePoints();
    if (pts.length === 0) return { minVal: 0, maxVal: 100 };
    const results = pts.map(p => p.result);
    let minVal = Math.min(...results);
    let maxVal = Math.max(...results);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 5);
      maxVal = maxVal + 5;
    } else {
      const padding = (maxVal - minVal) * 0.15;
      minVal = Math.max(0, minVal - padding);
      maxVal = maxVal + padding;
    }
    return { minVal, maxVal };
  });

  protected readonly gridYLines = computed(() => {
    const { minVal, maxVal } = this.lineLimits();
    const step = (maxVal - minVal) / 4;
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const value = minVal + step * i;
      // y coordinate mapping: 200 is bottom (minVal), 20 is top (maxVal)
      const y = 200 - ((value - minVal) / (maxVal - minVal)) * 180;
      lines.push({ value, y });
    }
    return lines;
  });

  protected readonly svgPoints = computed<TrendLinePoint[]>(() => {
    const pts = this.linePoints();
    const { minVal, maxVal } = this.lineLimits();
    if (pts.length === 0) return [];

    const numPoints = pts.length;
    // Map dates to chronological order spacing
    return pts.map((pt, i) => {
      const leftPct = numPoints > 1 ? (i / (numPoints - 1)) * 100 : 50;
      // x starts at 40, ends at 480
      const x = 40 + (leftPct / 100) * 440;
      // y starts at 200 (bottom, minVal), ends at 20 (top, maxVal)
      const y = 200 - ((pt.result - minVal) / (maxVal - minVal)) * 180;
      return {
        x,
        y,
        value: pt.result,
        date: pt.date,
        label: `${pt.result}`,
        leftPct: numPoints > 1 ? (i / (numPoints - 1)) * 100 : 50,
        hover: false
      };
    });
  });

  protected readonly svgPath = computed(() => {
    const pts = this.svgPoints();
    if (pts.length === 0) return '';
    return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  });

  protected readonly svgAreaPath = computed(() => {
    const pts = this.svgPoints();
    if (pts.length === 0) return '';
    const pathStr = this.svgPath();
    // Close the area down to the Y-axis bottom (y=200)
    const firstPt = pts[0];
    const lastPt = pts[pts.length - 1];
    return `${pathStr} L ${lastPt.x} 200 L ${firstPt.x} 200 Z`;
  });
}
