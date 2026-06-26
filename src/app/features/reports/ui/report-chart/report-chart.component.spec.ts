import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ReportChartComponent } from './report-chart.component';

try {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Ignora errori di inizializzazione multipla
}

describe('ReportChartComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReportChartComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportChartComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should compute bar heights correctly', () => {
    const fixture = TestBed.createComponent(ReportChartComponent);
    const component = fixture.componentInstance;

    // Set input values
    fixture.componentRef.setInput('chartType', 'bar');
    fixture.componentRef.setInput('resultA', 10.0);
    fixture.componentRef.setInput('resultB', 20.0);

    fixture.detectChanges();

    // Since B is 20 and A is 10, A's height should be 50% and B's should be 100%
    const barHeightA = component['barHeightA']();
    const barHeightB = component['barHeightB']();

    expect(barHeightA).toBe(50);
    expect(barHeightB).toBe(100);
  });

  it('should compute svg points for line trend chart correctly', () => {
    const fixture = TestBed.createComponent(ReportChartComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('chartType', 'line');
    fixture.componentRef.setInput('linePoints', [
      { date: new Date('2026-06-20'), result: 10.0 },
      { date: new Date('2026-06-25'), result: 30.0 }
    ]);

    fixture.detectChanges();

    const svgPoints = component['svgPoints']();
    expect(svgPoints).toHaveLength(2);
    // Point 0 (first point): x should be 40 (start of graph), y should be 200 (bottom of graph since result is min)
    expect(svgPoints[0].x).toBe(40);
    expect(svgPoints[0].y).toBeCloseTo(179.23, 1);

    // Point 1 (second point): x should be 480 (end of graph), y should be close to 40.77 due to padding
    expect(svgPoints[1].x).toBe(480);
    expect(svgPoints[1].y).toBeCloseTo(40.77, 1);
  });

  it('should format delta and percentage change correctly', () => {
    const fixture = TestBed.createComponent(ReportChartComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('chartType', 'bar');
    fixture.componentRef.setInput('delta', '5.00');
    fixture.componentRef.setInput('percentageChange', '25.00');

    fixture.detectChanges();

    const deltaValFormatted = component['deltaValFormatted']();
    expect(deltaValFormatted).toBe('+5.00 (+25.00%)');
  });
});
