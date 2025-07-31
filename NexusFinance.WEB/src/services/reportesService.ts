import { 
  DashboardFinancieroResponse, 
  GastosPorCategoriaResponse, 
  ProgresoMetasResponse, 
  BalanceCuentasResponse,
  ResumenEjecutivo,
  FiltrosReporte 
} from '../types/reportes.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class ReportesService {
  
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('nexus_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  }

  /**
   * Obtiene el dashboard financiero con KPIs principales
   */
  async obtenerDashboardFinanciero(filtros?: FiltrosReporte): Promise<DashboardFinancieroResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `/Reportes/dashboard-financiero${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene el reporte de gastos por categoría
   */
  async obtenerGastosPorCategoria(filtros?: FiltrosReporte): Promise<GastosPorCategoriaResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }
    if (filtros?.categoriaId) {
      params.append('categoriaId', filtros.categoriaId);
    }

    const url = `/Reportes/gastos-por-categoria${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene el reporte de progreso de metas financieras
   */
  async obtenerProgresoMetas(estadoMeta?: string): Promise<ProgresoMetasResponse> {
    const params = new URLSearchParams();
    
    if (estadoMeta) {
      params.append('estadoMeta', estadoMeta);
    }

    const url = `/Reportes/progreso-metas${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene el reporte de balance de cuentas
   */
  async obtenerBalanceCuentas(filtros?: FiltrosReporte): Promise<BalanceCuentasResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `/Reportes/balance-cuentas${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene un resumen ejecutivo con todos los reportes principales
   */
  async obtenerResumenEjecutivo(filtros?: FiltrosReporte): Promise<ResumenEjecutivo> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `/Reportes/resumen-ejecutivo${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Verifica el estado del servicio de reportes
   */
  async verificarEstadoServicio(): Promise<{ status: string; service: string; timestamp: string; version: string }> {
    const response = await fetch(`${API_BASE_URL}/Reportes/health`);

    if (!response.ok) {
      throw new Error(`Error al verificar estado del servicio: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Utilidades para fechas y filtros
   */
  static generarFiltrosPeriodo(periodo: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año', fechaPersonalizada?: { inicio: Date; fin: Date }): FiltrosReporte {
    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date = hoy;

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      
      case 'trimestre':
        const mesActual = hoy.getMonth();
        const inicioTrimestre = Math.floor(mesActual / 3) * 3;
        fechaInicio = new Date(hoy.getFullYear(), inicioTrimestre, 1);
        break;
      
      case 'año':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      
      default:
        if (fechaPersonalizada) {
          fechaInicio = fechaPersonalizada.inicio;
          fechaFin = fechaPersonalizada.fin;
        } else {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        }
    }

    return {
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0]
    };
  }

  /**
   * Formatea números para mostrar en la UI
   */
  static formatearMonto(monto: number, incluirSimbolo: boolean = true): string {
    const formateado = new Intl.NumberFormat('es-CO', {
      style: incluirSimbolo ? 'currency' : 'decimal',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);

    return formateado;
  }

  /**
   * Formatea porcentajes
   */
  static formatearPorcentaje(porcentaje: number, decimales: number = 1): string {
    return `${porcentaje.toFixed(decimales)}%`;
  }

  /**
   * Obtiene el color para una tendencia
   */
  static obtenerColorTendencia(tendencia: string): string {
    switch (tendencia) {
      case 'positiva':
        return 'text-green-600';
      case 'negativa':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Calcula el rango de fechas para diferentes períodos
   */
  static calcularRangoFechas(periodo: string): { inicio: Date; fin: Date } {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date = new Date(hoy);

    switch (periodo) {
      case 'últimos7días':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        break;
      
      case 'últimos30días':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 30);
        break;
      
      case 'mesActual':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      
      case 'mesAnterior':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      
      case 'añoActual':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      
      default:
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    return { inicio, fin };
  }
}

const reportesServiceInstance = new ReportesService();
export default reportesServiceInstance;
export { ReportesService };