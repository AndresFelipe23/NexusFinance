import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface PDFConfig {
  filename?: string;
  format?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  margin?: number;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

interface PDFHeader {
  title: string;
  subtitle?: string;
  date: string;
  user?: string;
  logo?: string;
}

class PDFService {
  private readonly defaultConfig: Required<PDFConfig> = {
    filename: 'reporte-nexusfinance.pdf',
    format: 'a4',
    orientation: 'portrait',
    quality: 1,
    margin: 15,
    includeHeader: true,
    includeFooter: true
  };

  async generarPDFDeElemento(
    elemento: HTMLElement, 
    config: PDFConfig = {},
    header?: PDFHeader,
    tableData?: { head: any[][], body: any[][] }
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const pdf = new jsPDF({
      orientation: finalConfig.orientation,
      unit: 'mm',
      format: finalConfig.format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = finalConfig.margin;

    if (finalConfig.includeHeader && header) {
      this.agregarHeader(pdf, header, pageWidth, margin);
    }

    if (tableData) {
      autoTable(pdf, {
        head: tableData.head,
        body: tableData.body,
        startY: margin + (finalConfig.includeHeader ? 35 : 0),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    } else {
      const canvas = await html2canvas(elemento, { scale: finalConfig.quality, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const contentWidth = pageWidth - (2 * margin);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yPosition = margin + (finalConfig.includeHeader ? 35 : 0);
      pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
    }

    if (finalConfig.includeFooter) {
      this.agregarFooter(pdf, pageWidth, pageHeight, margin);
    }

    pdf.save(finalConfig.filename);
  }

  private agregarHeader(pdf: jsPDF, header: PDFHeader, pageWidth: number, margin: number): void {
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 30, 'F');

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(header.title, margin, 15);

    if (header.subtitle) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(header.subtitle, margin, 22);
    }

    pdf.setFontSize(9);
    pdf.setTextColor(200, 200, 200);
    if (header.user) {
      pdf.text(`Usuario: ${header.user}`, pageWidth - margin, 15, { align: 'right' });
    }
    pdf.text(`Fecha: ${header.date}`, pageWidth - margin, 22, { align: 'right' });
  }

  private agregarFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    const footerText = `Reporte generado por NexusFinance | © ${new Date().getFullYear()}`;
    const pageNumText = `Página ${pdf.getCurrentPageInfo().pageNumber}`;
    pdf.text(footerText, margin, pageHeight - 10);
    pdf.text(pageNumText, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  async generarReporteCompleto(
    dashboardData: any,
    gastosData: any,
    metasData: any,
    cuentasData: any,
    config: PDFConfig = {}
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config, orientation: 'landscape' as 'landscape' };
    const pdf = new jsPDF(finalConfig);

    const usuario = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const headerInfo: PDFHeader = {
      title: 'Reporte Financiero Completo',
      subtitle: 'NexusFinance - Análisis Integral',
      date: fechaActual,
      user: usuario.nombre || 'Usuario'
    };

    // Página 1: Dashboard
    this.agregarHeader(pdf, { ...headerInfo, title: 'Dashboard Financiero' }, pdf.internal.pageSize.width, finalConfig.margin);
    // Aquí iría el contenido del dashboard, por ejemplo, un resumen o KPIs en texto
    autoTable(pdf, {
        startY: 40,
        head: [['KPI', 'Valor']],
        body: [
            ['Balance Total', dashboardData.kpIs.balanceTotal],
            ['Ingresos del Período', dashboardData.kpIs.ingresosPeriodo],
            ['Gastos del Período', dashboardData.kpIs.gastosPeriodo],
            ['Metas Activas', dashboardData.kpIs.metasActivas],
        ],
    });
    this.agregarFooter(pdf, pdf.internal.pageSize.width, pdf.internal.pageSize.height, finalConfig.margin);

    // Página 2: Gastos
    pdf.addPage();
    this.agregarHeader(pdf, { ...headerInfo, title: 'Gastos por Categoría' }, pdf.internal.pageSize.width, finalConfig.margin);
    autoTable(pdf, {
        startY: 40,
        head: [['Categoría', 'Total Gastado', 'Transacciones']],
        body: gastosData.resumenCategorias.map((c: any) => [c.categoria, c.totalGastado, c.numeroTransacciones]),
    });
    this.agregarFooter(pdf, pdf.internal.pageSize.width, pdf.internal.pageSize.height, finalConfig.margin);

    // ... y así para las demás secciones

    pdf.save(finalConfig.filename);
  }

  prepararElementoParaPDF(elemento: HTMLElement): () => void {
    this.cargarEstilosPDF();
    const clasesOriginales = elemento.className;
    elemento.classList.add('pdf-ready');
    this.convertirColoresOklch(elemento);
    const elementosHover = elemento.querySelectorAll('[class*="hover:"]');
    const elementosConAnimacion = elemento.querySelectorAll('[class*="transition"], [class*="animate"]');
    const elementosInteractivos = elemento.querySelectorAll('button:not([disabled]), a, [role="button"]');
    const estilosOriginales: { elemento: HTMLElement; className: string; style: string }[] = [];
    [...elementosHover, ...elementosConAnimacion].forEach((el) => {
      const htmlEl = el as HTMLElement;
      estilosOriginales.push({
        elemento: htmlEl,
        className: htmlEl.className,
        style: htmlEl.style.cssText
      });
      htmlEl.className = htmlEl.className
        .replace(/hover:[^\s]*/g, '')
        .replace(/transition[^\s]*/g, '')
        .replace(/animate[^\s]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    });
    elementosInteractivos.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.pointerEvents = 'none';
      htmlEl.style.cursor = 'default';
    });
    return () => {
      elemento.className = clasesOriginales;
      estilosOriginales.forEach(({ elemento, className, style }) => {
        elemento.className = className;
        elemento.style.cssText = style;
      });
      elementosInteractivos.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.pointerEvents = '';
        htmlEl.style.cursor = '';
      });
    };
  }

  private convertirColoresOklch(elemento: HTMLElement): void {
    const todosLosElementos = [elemento, ...Array.from(elemento.querySelectorAll('*'))];
    const mapaColores: Record<string, string> = {
      'oklch(0.985 0.002 264.37)': '#fafafa',
      'oklch(0.973 0.006 246.75)': '#f4f4f5',
      // ... (resto del mapa de colores)
    };
    todosLosElementos.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const estiloComputado = window.getComputedStyle(htmlEl);
      const color = estiloComputado.color;
      if (color && color.includes('oklch')) {
        const rgbEquivalente = this.buscarColorRGBEquivalente(color, mapaColores);
        if (rgbEquivalente) {
          htmlEl.style.color = rgbEquivalente;
        }
      }
      const backgroundColor = estiloComputado.backgroundColor;
      if (backgroundColor && backgroundColor.includes('oklch')) {
        const rgbEquivalente = this.buscarColorRGBEquivalente(backgroundColor, mapaColores);
        if (rgbEquivalente) {
          htmlEl.style.backgroundColor = rgbEquivalente;
        }
      }
      const borderColor = estiloComputado.borderColor;
      if (borderColor && borderColor.includes('oklch')) {
        const rgbEquivalente = this.buscarColorRGBEquivalente(borderColor, mapaColores);
        if (rgbEquivalente) {
          htmlEl.style.borderColor = rgbEquivalente;
        }
      }
    });
  }

  private buscarColorRGBEquivalente(colorOklch: string, mapaColores: Record<string, string>): string | null {
    if (mapaColores[colorOklch]) {
      return mapaColores[colorOklch];
    }
    if (colorOklch.includes('oklch')) {
      if (colorOklch.includes('0.9')) return '#f3f4f6';
      if (colorOklch.includes('0.8')) return '#e5e7eb';
      if (colorOklch.includes('0.7')) return '#d1d5db';
      if (colorOklch.includes('0.6')) return '#9ca3af';
      if (colorOklch.includes('0.5')) return '#6b7280';
      if (colorOklch.includes('0.4')) return '#4b5563';
      if (colorOklch.includes('0.3')) return '#374151';
      return '#1f2937';
    }
    return null;
  }

  private cargarEstilosPDF(): void {
    const styleId = 'pdf-optimization-styles';
    if (document.getElementById(styleId)) {
      return;
    }
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/src/styles/pdf-print.css';
    document.head.appendChild(link);
  }

  static generarNombreArchivo(tipoReporte: string, fecha: Date = new Date()): string {
    const fechaStr = fecha.toISOString().split('T')[0];
    const tipoLimpio = tipoReporte.toLowerCase().replace(/\s+/g, '-');
    return `nexusfinance-${tipoLimpio}-${fechaStr}.pdf`;
  }

  static obtenerConfiguracionPorTipo(tipoReporte: string): PDFConfig {
    const configs: Record<string, PDFConfig> = {
      'dashboard': {
        orientation: 'portrait',
        filename: PDFService.generarNombreArchivo('dashboard-financiero')
      },
      'gastos': {
        orientation: 'portrait',
        filename: PDFService.generarNombreArchivo('gastos-por-categoria')
      },
      'metas': {
        orientation: 'portrait',
        filename: PDFService.generarNombreArchivo('progreso-metas')
      },
      'cuentas': {
        orientation: 'landscape',
        filename: PDFService.generarNombreArchivo('balance-cuentas')
      },
      'completo': {
        orientation: 'portrait',
        filename: PDFService.generarNombreArchivo('reporte-completo')
      }
    };

    return configs[tipoReporte] || {};
  }
}

const pdfServiceInstance = new PDFService();
export default pdfServiceInstance;
export { PDFService };
