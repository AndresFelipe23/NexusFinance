import { authService } from './authService';
import type { Transferencia, CrearTransferenciaDTO, ActualizarTransferenciaDTO, EstadisticasTransferencias } from '../types/transferencia';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class TransferenciaService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      headers: {
        ...(await this.getAuthHeaders()),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_URL}/Transferencia${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async crearTransferencia(dto: CrearTransferenciaDTO): Promise<Transferencia> {
    return this.request<Transferencia>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async obtenerTransferenciasPorUsuario(usuarioId: string): Promise<Transferencia[]> {
    try {
      const result = await this.request<Transferencia[]>(`/usuario/${usuarioId}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error al obtener transferencias por usuario:', error);
      throw error;
    }
  }

  async obtenerTransferenciaPorId(transferenciaId: string): Promise<Transferencia> {
    return this.request<Transferencia>(`/${transferenciaId}`);
  }

  async actualizarTransferencia(dto: ActualizarTransferenciaDTO): Promise<Transferencia> {
    return this.request<Transferencia>('', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarTransferencia(transferenciaId: string): Promise<void> {
    return this.request<void>(`/${transferenciaId}`, {
      method: 'DELETE',
    });
  }

  async obtenerEstadisticas(usuarioId: string, fechaInicio?: string, fechaFin?: string): Promise<EstadisticasTransferencias> {
    let endpoint = `/estadisticas/${usuarioId}`;
    const params = new URLSearchParams();
    
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.request<EstadisticasTransferencias>(endpoint);
  }

  async obtenerTransferenciasPorPeriodo(usuarioId: string, fechaInicio: string, fechaFin: string): Promise<Transferencia[]> {
    try {
      // Convertir fechas a zona horaria local (Colombia UTC-5)
      const fechaInicioLocal = new Date(fechaInicio);
      const fechaFinLocal = new Date(fechaFin);
      
      // Ajustar a zona horaria de Colombia (UTC-5)
      const fechaInicioColombia = new Date(fechaInicioLocal.getTime() - (5 * 60 * 60 * 1000));
      const fechaFinColombia = new Date(fechaFinLocal.getTime() - (5 * 60 * 60 * 1000));
      
      const endpoint = `/periodo/${usuarioId}?fechaInicio=${fechaInicioColombia.toISOString()}&fechaFin=${fechaFinColombia.toISOString()}`;
      console.log('🔍 Debug - Llamando API:', `${API_URL}/Transferencia${endpoint}`);
      console.log('🔍 Debug - Fechas ajustadas:', {
        original: { fechaInicio, fechaFin },
        ajustada: { 
          fechaInicio: fechaInicioColombia.toISOString(), 
          fechaFin: fechaFinColombia.toISOString() 
        }
      });
      
      const result = await this.request<Transferencia[]>(endpoint);
      console.log('🔍 Debug - Respuesta de API:', result);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error al obtener transferencias por período:', error);
      throw error;
    }
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

  obtenerPeriodosTransferencia(): string[] {
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
}

export const transferenciaService = new TransferenciaService(); 