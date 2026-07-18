import { ReportPreviewResponse } from '../data-access/reports.model';
import { Athlete } from '../../athletes/data-access/athlete.model';
import { TestResponse } from '../../tests/data-access/test.model';
import { ReportSummaryStats, getTrendPeriodDirectly } from './reports.utils';

function getTestDateFormatted(testId: string | undefined, tests: TestResponse[]): string {
  if (!testId) return 'N/D';
  const test = tests.find(t => t.id === testId);
  if (!test || !test.executionDate) return 'N/D';
  return new Date(test.executionDate).toLocaleDateString('it-IT');
}

export async function exportReportToPDF(
  report: ReportPreviewResponse, 
  athlete: Athlete | null, 
  athleteId: string, 
  tests: TestResponse[], 
  stats: ReportSummaryStats | null
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Colors & Settings
  const primaryColor = [37, 99, 235]; // RGB #2563EB
  const textColorMain = [30, 41, 59]; // RGB var(--color-text-main)
  const textColorMuted = [100, 116, 139]; // RGB var(--color-text-muted)
  const lightBg = [248, 250, 252]; // RGB var(--color-bg-canvas)
  const borderCol = [226, 232, 240]; // RGB var(--color-border)

  let pageNum = 1;
  const addHeaderAndFooter = () => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(15, 10, 180, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('KARATEFLOW - SCHEDA PERFORMANCE', 15, 19);

    pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    pdf.setLineWidth(0.5);
    pdf.line(15, 22, 195, 22);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
    pdf.text(`Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 15, 287);
    pdf.text(`Pagina ${pageNum}`, 185, 287);
  };

  addHeaderAndFooter();

  // 1. Athlete Information Box
  pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  pdf.rect(15, 26, 180, 25, 'F');
  pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  pdf.rect(15, 26, 180, 25, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  pdf.text('PROFILO ATLETA', 19, 31);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);

  const ath = athlete;
  const name = ath ? `${ath.firstName} ${ath.lastName}` : `ID Atleta: ${athleteId}`;
  const birthDate = ath && ath.birthDate ? new Date(ath.birthDate).toLocaleDateString('it-IT') : 'N/D';
  const reference = ath && ath.referenceContact ? ath.referenceContact : 'N/D';

  pdf.setFont('helvetica', 'bold');
  pdf.text(name, 19, 37);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Data Nascita: ${birthDate}`, 19, 42);
  pdf.text(`Contatto Riferimento: ${reference}`, 19, 47);

  // 2. Report metadata
  const isComparison = report.analysisType === 'COMPARISON';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  pdf.text('DETTAGLI REPORT', 115, 31);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  pdf.text(`Tipo Analisi: ${isComparison ? 'Confronto A vs B' : 'Trend Temporale'}`, 115, 37);

  if (isComparison) {
    const dateA = getTestDateFormatted(report.testIdA, tests);
    const dateB = getTestDateFormatted(report.testIdB, tests);
    pdf.text(`Test Baseline (A): ${dateA}`, 115, 42);
    pdf.text(`Test Confronto (B): ${dateB}`, 115, 47);
  } else {
    const period = getTrendPeriodDirectly(report);
    pdf.text(`Periodo Analisi: ${period}`, 115, 42);
  }

  // Draw summary metrics box
  if (stats) {
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.rect(15, 55, 180, 16, 'F');
    pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    pdf.rect(15, 55, 180, 16, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    const labelText = 'MIGLIORAMENTO COMPLESSIVO: ';
    pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
    pdf.text(labelText, 19, 65);

    if (stats.overallImprovement > 0) {
      pdf.setTextColor(4, 120, 87); // Green var(--color-success)
    } else if (stats.overallImprovement < 0) {
      pdf.setTextColor(190, 18, 60); // Red #be123c
    } else {
      pdf.setTextColor(120, 120, 120); // Gray
    }

    const directionSign = stats.overallImprovement >= 0 ? '+' : '';
    const valueText = `${directionSign}${stats.overallImprovement.toFixed(2)}%`;
    const labelWidth = (pdf.getStringUnitWidth(labelText) * 10) / pdf.internal.scaleFactor;
    pdf.text(valueText, 19 + labelWidth, 65);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
    pdf.text(`Esercizi: ${stats.improved} Migliorati  |  ${stats.worsened} Peggiorati  |  ${stats.stable} Stabili`, 115, 65);
  }

  // Compute Composed Overall Trend Points (weighted average) for TREND analysis
  let composedPoints: { date?: Date; label?: string; result: number }[] = [];
  
  if (isComparison) {
    if (stats) {
      composedPoints.push({ label: 'Baseline', result: 0 });
      composedPoints.push({ label: 'Confronto', result: stats.overallImprovement });
    }
  } else {
    const dateMap = new Map<string, Date>();
    const trends = report.exerciseTrends || [];
    trends.forEach(t => {
      (t.dataPoints || []).forEach(dp => {
        const d = new Date(dp.date);
        const timeKey = d.getTime().toString();
        dateMap.set(timeKey, d);
      });
    });
    const sortedTimes = Array.from(dateMap.keys()).map(Number).sort((a, b) => a - b);
    
    if (sortedTimes.length >= 2) {
      const baselines = trends.map(t => {
        const pts = (t.dataPoints || []).map(dp => ({
          time: new Date(dp.date).getTime(),
          result: dp.result
        })).sort((a, b) => a.time - b.time);
        return {
          baseVal: pts.length > 0 ? pts[0].result : 0,
          greaterIsBetter: t.greaterIsBetter,
          dataPoints: pts
        };
      }).filter(b => b.baseVal !== 0);

      composedPoints = sortedTimes.map(time => {
        let weightedSum = 0;
        let totalWeight = 0;
        baselines.forEach(b => {
          const pt = b.dataPoints.find(p => p.time === time);
          if (pt) {
            const delta = pt.result - b.baseVal;
            const pct = (delta / b.baseVal) * 100;
            const imp = b.greaterIsBetter ? pct : -pct;
            weightedSum += b.baseVal * imp;
            totalWeight += b.baseVal;
          }
        });
        return {
          date: dateMap.get(time.toString())!,
          result: totalWeight > 0 ? (weightedSum / totalWeight) : 0
        };
      });
    }
  }

  // Draw Composed Trend Line Chart in PDF
  if (composedPoints.length >= 2) {
    const chartX = 15;
    const chartY = 75;
    const chartW = 180;
    const chartH = 40;

    // Draw background box
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.rect(chartX, chartY, chartW, chartH, 'F');
    pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    pdf.rect(chartX, chartY, chartW, chartH, 'S');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
    pdf.text('GRAFICO ANDAMENTO COMPOSTO DEI MIGLIORAMENTI (%)', chartX + 4, chartY + 5);

    // Get min and max values for Y axis scaling
    const results = composedPoints.map(p => p.result);
    let minVal = Math.min(...results);
    let maxVal = Math.max(...results);
    if (minVal === maxVal) {
      minVal = Math.max(-5, minVal - 5);
      maxVal = maxVal + 5;
    } else {
      const padding = (maxVal - minVal) * 0.15;
      minVal = minVal - padding;
      maxVal = maxVal + padding;
    }

    // Draw grid lines (3 lines)
    pdf.setDrawColor(borderCol[0] + 10, borderCol[1] + 10, borderCol[2] + 10);
    pdf.setLineWidth(0.2);
    for (let i = 0; i <= 2; i++) {
      const val = minVal + ((maxVal - minVal) / 2) * i;
      const y = chartY + chartH - 8 - ((val - minVal) / (maxVal - minVal)) * (chartH - 16);
      pdf.line(chartX + 15, y, chartX + chartW - 10, y);
      
      // Label
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
      const sign = val >= 0 ? '+' : '';
      pdf.text(`${sign}${val.toFixed(1)}%`, chartX + 3, y + 1.5);
    }

    // Compute coordinates
    const numPoints = composedPoints.length;
    const svgPoints = composedPoints.map((pt, i) => {
      const leftPct = numPoints > 1 ? i / (numPoints - 1) : 0.5;
      const x = chartX + 20 + leftPct * (chartW - 35);
      const y = chartY + chartH - 8 - ((pt.result - minVal) / (maxVal - minVal)) * (chartH - 16);
      return { x, y, val: pt.result, date: pt.date, label: pt.label };
    });

    // Draw line path
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.8);
    for (let i = 0; i < svgPoints.length - 1; i++) {
      pdf.line(svgPoints[i].x, svgPoints[i].y, svgPoints[i+1].x, svgPoints[i+1].y);
    }

    // Draw points & labels
    svgPoints.forEach(pt => {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setLineWidth(0.5);
      pdf.circle(pt.x, pt.y, 1.2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
      const sign = pt.val >= 0 ? '+' : '';
      pdf.text(`${sign}${pt.val.toFixed(1)}%`, pt.x - 3, pt.y - 2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
      const labelStr = pt.label ? pt.label : (pt.date ? pt.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : '');
      pdf.text(labelStr, pt.x - 3, chartY + chartH - 3);
    });
  }

  // Table Title
  const tableTitleY = composedPoints.length >= 2 ? 123 : 78;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  pdf.text('ANALISI DETTAGLIATA ESERCIZI', 15, tableTitleY);

  // 3. Table Header
  let y = composedPoints.length >= 2 ? 127 : 82;
  const drawTableHeader = () => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(15, y, 180, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255); // White

    if (isComparison) {
      pdf.text('Esercizio', 18, y + 5.5);
      pdf.text('Baseline (A)', 110, y + 5.5, { align: 'right' });
      pdf.text('Confronto (B)', 140, y + 5.5, { align: 'right' });
      pdf.text('Delta', 165, y + 5.5, { align: 'right' });
      pdf.text('% Variazione', 190, y + 5.5, { align: 'right' });
    } else {
      pdf.text('Esercizio', 18, y + 5.5);
      pdf.text('Inizio', 110, y + 5.5, { align: 'right' });
      pdf.text('Fine', 140, y + 5.5, { align: 'right' });
      pdf.text('Rilevazioni', 165, y + 5.5, { align: 'right' });
      pdf.text('Miglioramento', 190, y + 5.5, { align: 'right' });
    }
    y += 8;
  };

  drawTableHeader();

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  if (isComparison) {
    const results = report.comparisonResults || [];
    results.forEach(c => {
      if (y > 270) {
        pdf.addPage();
        pageNum++;
        y = 25;
        addHeaderAndFooter();
        drawTableHeader();
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
      }

      if (y % 2 === 0) {
        pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        pdf.rect(15, y, 180, 8, 'F');
      }

      pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
      pdf.setFont('helvetica', 'bold');
      const title = c.exerciseTitle.length > 40 ? c.exerciseTitle.substring(0, 37) + '...' : c.exerciseTitle;
      pdf.text(title, 18, y + 5.5);
      pdf.setFont('helvetica', 'normal');

      const valA = c.resultA !== null ? `${c.resultA} ${c.unit.toLowerCase()}` : 'N/D';
      const valB = c.resultB !== null ? `${c.resultB} ${c.unit.toLowerCase()}` : 'N/D';
      pdf.text(valA, 110, y + 5.5, { align: 'right' });
      pdf.text(valB, 140, y + 5.5, { align: 'right' });

      const deltaVal = parseFloat(c.delta);
      const isImp = c.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
      const isStab = deltaVal === 0;

      if (c.delta === 'N/A') {
        pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
      } else if (isStab) {
        pdf.setTextColor(120, 120, 120);
      } else if (isImp) {
        pdf.setTextColor(4, 120, 87); // Green var(--color-success)
      } else {
        pdf.setTextColor(190, 18, 60); // Red #be123c
      }

      const sign = deltaVal > 0 ? '+' : '';
      const deltaStr = c.delta === 'N/A' ? 'N/A' : `${sign}${c.delta} ${c.unit.toLowerCase()}`;
      pdf.text(deltaStr, 165, y + 5.5, { align: 'right' });

      const pctStr = c.percentageChange === 'N/A' ? 'N/A' : `${sign}${c.percentageChange}%`;
      pdf.text(pctStr, 190, y + 5.5, { align: 'right' });

      pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      pdf.setLineWidth(0.3);
      pdf.line(15, y + 8, 195, y + 8);

      y += 8;
    });
  } else {
    const results = report.exerciseTrends || [];
    results.forEach(t => {
      if (y > 270) {
        pdf.addPage();
        pageNum++;
        y = 25;
        addHeaderAndFooter();
        drawTableHeader();
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
      }

      if (y % 2 === 0) {
        pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        pdf.rect(15, y, 180, 8, 'F');
      }

      pdf.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
      pdf.setFont('helvetica', 'bold');
      const title = t.exerciseTitle.length > 40 ? t.exerciseTitle.substring(0, 37) + '...' : t.exerciseTitle;
      pdf.text(title, 18, y + 5.5);
      pdf.setFont('helvetica', 'normal');

      const pts = t.dataPoints || [];
      const valA = pts.length > 0 ? `${pts[0].result} ${t.unit.toLowerCase()}` : 'N/D';
      const valB = pts.length > 0 ? `${pts[pts.length - 1].result} ${t.unit.toLowerCase()}` : 'N/D';

      pdf.text(valA, 110, y + 5.5, { align: 'right' });
      pdf.text(valB, 140, y + 5.5, { align: 'right' });
      pdf.text(`${pts.length}`, 165, y + 5.5, { align: 'right' });

      if (pts.length >= 2) {
        const deltaVal = pts[pts.length - 1].result - pts[0].result;
        const isImp = t.greaterIsBetter ? deltaVal > 0 : deltaVal < 0;
        const isStab = deltaVal === 0;

        if (isStab) {
          pdf.setTextColor(120, 120, 120);
        } else if (isImp) {
          pdf.setTextColor(4, 120, 87);
        } else {
          pdf.setTextColor(190, 18, 60);
        }

        const sign = deltaVal > 0 ? '+' : '';
        const firstVal = pts[0].result;
        const pctVal = firstVal !== 0 ? (deltaVal / firstVal) * 100 : 0;
        const trendStr = `${sign}${deltaVal.toFixed(1)} (${sign}${pctVal.toFixed(1)}%)`;
        pdf.text(trendStr, 190, y + 5.5, { align: 'right' });
      } else {
        pdf.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        pdf.text('N/D', 190, y + 5.5, { align: 'right' });
      }

      pdf.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      pdf.setLineWidth(0.3);
      pdf.line(15, y + 8, 195, y + 8);

      y += 8;
    });
  }

  const athleteNameSafe = ath ? `${ath.firstName}_${ath.lastName}`.toLowerCase() : athleteId;
  const typeStr = isComparison ? 'confronto' : 'trend';
  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`report_${typeStr}_${athleteNameSafe}_${dateStr}.pdf`);
}
