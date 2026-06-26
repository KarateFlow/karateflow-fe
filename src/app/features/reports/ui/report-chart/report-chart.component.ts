import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

export interface ChartDataPoint {
  date: Date;
  result: number;
}

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="chart-container">
      @if (chartType() === 'bar') {
        <!-- Grouped Bar Chart for A vs B Comparison -->
        <div class="bar-chart-layout">
          <div class="bar-wrapper">
            <div class="bar-col">
              <div class="bar-track">
                <div class="bar-fill value-a" [style.height.%]="barHeightA()">
                  <span class="bar-tooltip">{{ resultA() | number:'1.0-2' }}{{ unit() }}</span>
                </div>
              </div>
              <span class="bar-label font-mono text-xs">Test A</span>
              <span class="bar-date text-xs text-muted">{{ dateA() | date:'dd/MM/yyyy' }}</span>
            </div>

            <div class="bar-col">
              <div class="bar-track">
                <div class="bar-fill value-b" [style.height.%]="barHeightB()">
                  <span class="bar-tooltip">{{ resultB() | number:'1.0-2' }}{{ unit() }}</span>
                </div>
              </div>
              <span class="bar-label font-mono text-xs">Test B</span>
              <span class="bar-date text-xs text-muted">{{ dateB() | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>
          
          <div class="delta-summary">
            <span class="text-xs text-muted uppercase tracking-wider font-bold">Variazione</span>
            <div class="delta-val" [class.positive]="isPositiveChange()" [class.negative]="!isPositiveChange()">
              {{ deltaValFormatted() }}
            </div>
          </div>
        </div>
      } @else {
        <!-- SVG Line Chart for Trend -->
        @if (linePoints().length === 0) {
          <div class="empty-chart">Nessun dato per tracciare il grafico</div>
        } @else {
          <div class="svg-wrapper">
            <svg viewBox="0 0 500 240" class="trend-svg" width="100%" height="100%">
              <!-- Grid Lines -->
              @for (yVal of gridYLines(); track $index) {
                <line x1="40" [attr.y1]="yVal.y" x2="480" [attr.y2]="yVal.y" class="grid-line" />
                <text x="35" [attr.y]="yVal.y + 4" class="y-axis-label">{{ yVal.value | number:'1.0-1' }}</text>
              }

              <!-- The Line Path -->
              <path [attr.d]="svgPath()" fill="none" class="chart-path" stroke-width="3" stroke-linecap="round" />
              <!-- Area under line -->
              <path [attr.d]="svgAreaPath()" class="chart-area-fill" />

              <!-- Data Points and Interactive Hover Zones -->
              @for (pt of svgPoints(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="5" class="chart-point" />
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="14" class="chart-point-trigger">
                  <title>{{ pt.label }} ({{ pt.date | date:'dd/MM/yyyy' }})</title>
                </circle>
              }
            </svg>

            <!-- X Axis Labels (Dates) -->
            <div class="x-axis-labels">
              @for (pt of svgPoints(); track $index) {
                <div class="x-label-item" [style.left.%]="pt.leftPct">
                  <span class="x-date">{{ pt.date | date:'dd/MM' }}</span>
                  <span class="x-val">{{ pt.value | number:'1.0-1' }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .chart-container {
      padding: 1.5rem;
      position: relative;
    }

    /* Bar Chart styling */
    .bar-chart-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      align-items: center;
      min-height: 220px;
    }

    .bar-wrapper {
      display: flex;
      justify-content: space-around;
      height: 180px;
      gap: 1.5rem;
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
    }

    .bar-track {
      background: #f1f5f9;
      width: 40px;
      height: 130px;
      border-radius: var(--radius-lg);
      position: relative;
      overflow: visible;
      margin-bottom: 0.5rem;
    }

    .bar-fill {
      width: 100%;
      position: absolute;
      bottom: 0;
      border-radius: var(--radius-lg);
      transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      justify-content: center;
    }

    .bar-fill.value-a {
      background: linear-gradient(to top, #2563eb, #3b82f6);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .bar-fill.value-b {
      background: linear-gradient(to top, #0ea5e9, #38bdf8);
      box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);
    }

    .bar-tooltip {
      position: absolute;
      top: -30px;
      background: #0f172a;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-lg);
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      opacity: 0.9;
    }

    .bar-label {
      font-weight: 700;
      color: var(--color-text-main);
    }

    .bar-date {
      font-size: 0.7rem;
    }

    .delta-summary {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: var(--radius-lg);
      border: 1px solid #f1f5f9;
      text-align: center;
    }

    .delta-val {
      font-size: 2rem;
      font-weight: 800;
      margin: 0.5rem 0;
    }

    .delta-val.positive {
      color: #16a34a;
    }

    .delta-val.negative {
      color: #dc2626;
    }

    /* Line Chart SVG styling */
    .svg-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
    }

    .trend-svg {
      overflow: visible;
    }

    .grid-line {
      stroke: #f1f5f9;
      stroke-width: 1;
    }

    .y-axis-label {
      font-size: 8px;
      fill: var(--color-text-muted);
      font-weight: 600;
      text-anchor: end;
    }

    .chart-path {
      stroke: var(--color-primary-aka);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 4px 6px rgba(37, 99, 235, 0.2));
    }

    .chart-area-fill {
      fill: url(#gradient-fill);
      opacity: 0.1;
      pointer-events: none;
    }

    .chart-point {
      fill: white;
      stroke: var(--color-primary-aka);
      stroke-width: 3;
      transition: r 0.2s ease;
    }

    .chart-point-trigger {
      fill: transparent;
      cursor: pointer;
    }

    .chart-point-trigger:hover + .chart-point,
    .chart-point-trigger:hover {
      r: 8;
      stroke: var(--color-secondary-ao);
    }

    /* X Axis styling */
    .x-axis-labels {
      position: absolute;
      bottom: -20px;
      left: 40px;
      right: 20px;
      height: 20px;
      display: flex;
    }

    .x-label-item {
      position: absolute;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .x-date {
      font-size: 9px;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .x-val {
      font-size: 8px;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .empty-chart {
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      font-style: italic;
    }

    .text-muted {
      color: var(--color-text-muted);
    }
  `,
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

  protected readonly svgPoints = computed(() => {
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
        leftPct: numPoints > 1 ? (i / (numPoints - 1)) * 100 : 50
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
