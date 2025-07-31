import { authService } from './authService';
import type { 
  DashboardData, 
  DashboardStats, 
  TransaccionPorCategoria,
  TendenciaMensual,
  MetaResumen,
  CuentaResumen
} from '../types/dashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class DashboardService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const config: RequestInit = {
        headers: {
          ...(await this.getAuthHeaders()),
          ...options.headers,
        },
        ...options,
      };

      const url = `${API_URL}/Dashboard${endpoint}`;
      console.log('🔍 Dashboard API Request:', url);

      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
          window.location.href = '/';
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Dashboard API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Dashboard API Error:', error);
      throw error;
    }
  }

  async obtenerDashboardData(): Promise<DashboardData> {
    try {
      const usuario = authService.getUser();
      if (!usuario) {
        throw new Error('Usuario no autenticado');
      }

      // Usar el nuevo endpoint del dashboard completo
      const dashboardCompleto = await this.request<any>(`/completo/${usuario.usuarioId}`);

      // Transformar los datos del backend al formato esperado por el frontend
      const stats: DashboardStats = {
        totalIngresos: dashboardCompleto.estadisticas.totalIngresos,
        totalGastos: dashboardCompleto.estadisticas.totalGastos,
        balance: dashboardCompleto.estadisticas.balance,
        transaccionesCount: dashboardCompleto.estadisticas.transaccionesCount,
        cuentasCount: dashboardCompleto.estadisticas.cuentasCount,
        metasCount: dashboardCompleto.estadisticas.metasCount,
        metasCompletadas: dashboardCompleto.estadisticas.metasCompletadas,
        presupuestosCount: dashboardCompleto.estadisticas.presupuestosCount
      };

      // Combinar gastos e ingresos por categoría
      const transaccionesPorCategoria: TransaccionPorCategoria[] = [
        ...dashboardCompleto.gastosPorCategoria.map((cat: any) => ({
          nombreCategoria: cat.nombreCategoria,
          color: cat.color,
          icono: cat.iconoCategoria,
          monto: cat.montoTotal,
          tipoCategoria: 'gasto',
          transaccionesCount: cat.transaccionesCount
        })),
        ...dashboardCompleto.ingresosPorCategoria.map((cat: any) => ({
          nombreCategoria: cat.nombreCategoria,
          color: cat.color,
          icono: cat.iconoCategoria,
          monto: cat.montoTotal,
          tipoCategoria: 'ingreso',
          transaccionesCount: cat.transaccionesCount
        }))
      ];

      const tendenciasMensuales: TendenciaMensual[] = dashboardCompleto.tendenciasMensuales.map((tend: any) => ({
        mes: tend.mesNombre,
        ingresos: tend.ingresos,
        gastos: tend.gastos,
        balance: tend.balance
      }));

      const metasResumen: MetaResumen[] = dashboardCompleto.metasResumen.map((meta: any) => ({
        metaId: meta.metaId,
        nombreMeta: meta.nombreMeta,
        montoObjetivo: meta.montoObjetivo,
        montoActual: meta.montoActual,
        porcentajeProgreso: meta.porcentajeProgreso,
        diasRestantes: meta.diasRestantes,
        estaCompletada: meta.estaCompletada
      }));

      const cuentasResumen: CuentaResumen[] = dashboardCompleto.cuentasResumen.map((cuenta: any) => ({
        cuentaId: cuenta.cuentaId,
        nombreCuenta: cuenta.nombreCuenta,
        tipoCuenta: cuenta.tipoCuenta,
        saldo: cuenta.saldo,
        nombreBanco: cuenta.nombreBanco,
        moneda: cuenta.moneda
      }));

      const transaccionesRecientes = dashboardCompleto.transaccionesRecientes.map((trans: any) => ({
        transaccionId: trans.transaccionId,
        monto: trans.monto,
        tipoTransaccion: trans.tipoTransaccion,
        descripcion: trans.descripcion,
        fechaTransaccion: trans.fechaTransaccion,
        nombreCategoria: trans.nombreCategoria,
        tipoCategoria: trans.tipoCategoria,
        iconoCategoria: trans.iconoCategoria,
        color: trans.color,
        nombreCuenta: trans.nombreCuenta,
        tipoCuenta: trans.tipoCuenta,
        nombreBanco: trans.nombreBanco
      }));

      return {
        stats,
        transaccionesPorCategoria,
        tendenciasMensuales,
        metasResumen,
        cuentasResumen,
        transaccionesRecientes
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  }


  // Métodos de utilidad para formateo
  formatearMonto(monto: number, moneda: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  }

  formatearMontoCompacto(monto: number): string {
    if (monto >= 1000000) {
      return `$${(monto / 1000000).toFixed(1)}M`;
    } else if (monto >= 1000) {
      return `$${(monto / 1000).toFixed(1)}K`;
    }
    return `$${monto.toLocaleString('es-CO')}`;
  }

  obtenerColorBalance(balance: number): string {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  obtenerIconoBalance(balance: number): string {
    if (balance > 0) return '📈';
    if (balance < 0) return '📉';
    return '➖';
  }
}

export const dashboardService = new DashboardService();