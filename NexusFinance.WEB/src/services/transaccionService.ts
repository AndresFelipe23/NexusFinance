import { authService } from './authService';
import type { 
  Transaccion, 
  CrearTransaccionDTO, 
  ActualizarTransaccionDTO, 
  FiltrosTransaccion,
  EstadisticasTransacciones 
} from '../types/transaccion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class TransaccionService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    console.log('🔍 Debug - Token obtenido:', token ? 'Token presente' : 'Token ausente');
    console.log('🔍 Debug - Token completo:', token);
    
    if (!token) {
      console.error('❌ Error: No hay token de autenticación');
      throw new Error('No hay token de autenticación');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log('🔍 Debug - Iniciando request');
      console.log('🔍 Debug - endpoint:', endpoint);
      console.log('🔍 Debug - options:', options);
      
      const config: RequestInit = {
        headers: {
          ...(await this.getAuthHeaders()),
          ...options.headers,
        },
        ...options,
      };

      const url = `${API_URL}/Transaccione${endpoint}`;
      console.log('🔍 Debug - URL de la petición:', url);
      console.log('🔍 Debug - Configuración:', config);

      const response = await fetch(url, config);
      console.log('🔍 Debug - Status de la respuesta:', response.status);
      console.log('🔍 Debug - Status text:', response.statusText);
      
      if (!response.ok) {
        console.error(`❌ Error ${response.status}: ${response.statusText}`);
        
        if (response.status === 401) {
          console.error('❌ Token expirado o inválido');
          // Limpiar token expirado
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
          // Redirigir al login
          window.location.href = '/';
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error data:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Debug - Datos de respuesta:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en request:', error);
      throw error;
    }
  }

  async crearTransaccion(dto: CrearTransaccionDTO): Promise<Transaccion> {
    return this.request<Transaccion>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async obtenerTransaccionesPorUsuario(usuarioId: string, filtros?: FiltrosTransaccion): Promise<Transaccion[]> {
    try {
      console.log('🔍 Debug - Iniciando obtenerTransaccionesPorUsuario');
      console.log('🔍 Debug - usuarioId:', usuarioId);
      console.log('🔍 Debug - filtros:', filtros);
      
      const params = new URLSearchParams();
      
      if (filtros) {
        if (filtros.cuentaId) params.append('cuentaId', filtros.cuentaId);
        if (filtros.categoriaId) params.append('categoriaId', filtros.categoriaId);
        if (filtros.tipoTransaccion) params.append('tipoTransaccion', filtros.tipoTransaccion);
        if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
        if (filtros.montoMinimo) params.append('montoMinimo', filtros.montoMinimo.toString());
        if (filtros.montoMaximo) params.append('montoMaximo', filtros.montoMaximo.toString());
        if (filtros.busquedaTexto) params.append('busquedaTexto', filtros.busquedaTexto);
        if (filtros.soloConciliadas !== undefined) params.append('soloConciliadas', filtros.soloConciliadas.toString());
        if (filtros.pagina) params.append('pagina', filtros.pagina.toString());
        if (filtros.tamanoPagina) params.append('tamanoPagina', filtros.tamanoPagina.toString());
        if (filtros.ordenarPor) params.append('ordenarPor', filtros.ordenarPor);
      }

      const endpoint = `/usuario/${usuarioId}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Debug - endpoint completo:', endpoint);
      console.log('🔍 Debug - URL completa:', `${API_URL}/Transaccione${endpoint}`);
      
      const result = await this.request<Transaccion[]>(endpoint);
      console.log('🔍 Debug - Resultado obtenido:', result);
      console.log('🔍 Debug - Tipo de resultado:', typeof result);
      console.log('🔍 Debug - Es array:', Array.isArray(result));
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('❌ Error al obtener transacciones por usuario:', error);
      throw error;
    }
  }

  async obtenerTransaccionPorId(transaccionId: string): Promise<Transaccion> {
    return this.request<Transaccion>(`/${transaccionId}`);
  }

  async actualizarTransaccion(dto: ActualizarTransaccionDTO): Promise<Transaccion> {
    return this.request<Transaccion>(`/${dto.transaccionId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarTransaccion(transaccionId: string, validarSaldo: boolean = true): Promise<void> {
    return this.request<void>(`/${transaccionId}?validarSaldo=${validarSaldo}`, {
      method: 'DELETE',
    });
  }

  async obtenerTiposTransaccion(): Promise<string[]> {
    return this.request<string[]>('/tipos');
  }

  // Métodos de utilidad para formateo
  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerColorPorTipo(tipoTransaccion: string): string {
    switch (tipoTransaccion) {
      case 'ingreso':
        return 'text-green-600';
      case 'gasto':
        return 'text-red-600';
      case 'transferencia':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  obtenerIconoPorTipo(tipoTransaccion: string): string {
    switch (tipoTransaccion) {
      case 'ingreso':
        return '💰';
      case 'gasto':
        return '💸';
      case 'transferencia':
        return '🔄';
      default:
        return '📊';
    }
  }

  obtenerPeriodosTransaccion(): string[] {
    return [
      'Sin filtro',
      'Hoy',
      'Última semana',
      'Último mes',
      'Último trimestre',
      'Último año',
      'Personalizado'
    ];
  }

  obtenerFechasPorPeriodo(periodo: string): { fechaInicio: Date; fechaFin: Date } {
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    
    let fechaInicio: Date;
    
    switch (periodo) {
      case 'Hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case 'Última semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Último mes':
        // Calcular correctamente el mes anterior
        const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        fechaInicio = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
        break;
      case 'Último trimestre':
        // Calcular correctamente 3 meses atrás
        const trimestreAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
        fechaInicio = new Date(trimestreAnterior.getFullYear(), trimestreAnterior.getMonth(), 1);
        break;
      case 'Último año':
        // Calcular correctamente el año anterior
        fechaInicio = new Date(ahora.getFullYear() - 1, 0, 1); // 1 de enero del año anterior
        break;
      default:
        // Último mes por defecto (30 días atrás)
        fechaInicio = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Asegurar que fechaFin sea el final del día actual
    fechaFin.setHours(23, 59, 59, 999);
    
    return { fechaInicio, fechaFin };
  }

  calcularEstadisticas(transacciones: Transaccion[]): EstadisticasTransacciones {
    const ingresos = transacciones.filter(t => t.tipoTransaccion === 'ingreso');
    const gastos = transacciones.filter(t => t.tipoTransaccion === 'gasto');
    
    const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
    const totalGastos = gastos.reduce((sum, t) => sum + t.monto, 0);
    
    return {
      totalTransacciones: transacciones.length,
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      promedioIngresos: ingresos.length > 0 ? totalIngresos / ingresos.length : 0,
      promedioGastos: gastos.length > 0 ? totalGastos / gastos.length : 0,
      transaccionMasAlta: transacciones.length > 0 ? Math.max(...transacciones.map(t => t.monto)) : 0,
      transaccionMasBaja: transacciones.length > 0 ? Math.min(...transacciones.map(t => t.monto)) : 0,
      primeraTransaccion: transacciones.length > 0 ? transacciones[transacciones.length - 1]?.fechaTransaccion : undefined,
      ultimaTransaccion: transacciones.length > 0 ? transacciones[0]?.fechaTransaccion : undefined
    };
  }
}

export const transaccionService = new TransaccionService(); 