import { API_BASE_URL } from '../utils/constants';
import { authService } from './authService';
import type { GastoViaje } from '../types/gastoViaje';

interface CrearGastoViajeDTO {
  planId: string;
  categoriaViajeId: string;
  monto: number;
  monedaGasto: string;
  descripcion: string;
  fechaGasto?: string; // ISO date string
  ubicacion?: string;
  numeroPersonas?: number;
  actividadId?: string;
  transaccionId?: string;
  tasaCambioUsada?: number;
  urlRecibo?: string;
  notas?: string;
}

interface ActualizarGastoViajeDTO {
  gastoViajeId: string;
  categoriaViajeId?: string;
  monto?: number;
  monedaGasto?: string;
  descripcion?: string;
  fechaGasto?: string; // ISO date string
  ubicacion?: string;
  numeroPersonas?: number;
  actividadId?: string;
  tasaCambioUsada?: number;
  urlRecibo?: string;
  notas?: string;
  cambiarActividad?: boolean;
  recalcularMontoLocal?: boolean;
}

class GastosViajeService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/GastosViaje${endpoint}`,
      {
        headers: await this.getAuthHeaders(),
        ...options,
      }
    );
    if (!response.ok) {
      let errorMessage = 'Error en la petición';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      // Manejar casos específicos
      if (response.status === 404) {
        throw new Error('El plan de vacaciones especificado no existe');
      } else if (response.status === 400) {
        throw new Error('ID de plan inválido');
      } else if (response.status === 401) {
        authService.handleUnauthorized();
        throw new Error('No autorizado');
      }
      
      throw new Error(errorMessage);
    }
    return response.json();
  }

  async crearGasto(dto: CrearGastoViajeDTO): Promise<GastoViaje> {
    return this.request<GastoViaje>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async actualizarGasto(dto: ActualizarGastoViajeDTO): Promise<GastoViaje> {
    return this.request<GastoViaje>(`/${dto.gastoViajeId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarGasto(gastoViajeId: string): Promise<void> {
    return this.request<void>(`/${gastoViajeId}`, {
      method: 'DELETE',
    });
  }

  async obtenerGastoPorId(gastoViajeId: string): Promise<GastoViaje> {
    return this.request<GastoViaje>(`/${gastoViajeId}`);
  }

  async obtenerGastosPorPlan(planId: string, categoriaViajeId?: string, actividadId?: string, fechaDesde?: string, fechaHasta?: string, montoMinimo?: number, montoMaximo?: number, monedaGasto?: string, ordenarPor: string = "Fecha", incluirResumen: boolean = true): Promise<GastoViaje[]> {
    // Validar planId en el frontend
    if (!planId || planId.trim() === '' || planId === '00000000-0000-0000-0000-000000000000' || planId === '00000000-0000-0000-0000-000000000001') {
      throw new Error('Debe proporcionar un ID de plan de vacaciones válido');
    }

    const params = new URLSearchParams();
    params.append('planId', planId);
    if (categoriaViajeId) params.append('categoriaViajeId', categoriaViajeId);
    if (actividadId) params.append('actividadId', actividadId);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (montoMinimo) params.append('montoMinimo', montoMinimo.toString());
    if (montoMaximo) params.append('montoMaximo', montoMaximo.toString());
    if (monedaGasto) params.append('monedaGasto', monedaGasto);
    params.append('ordenarPor', ordenarPor);
    params.append('incluirResumen', incluirResumen.toString());
    return this.request<GastoViaje[]>(`/plan/${planId}?${params.toString()}`);
  }

  async analisisPorCategoria(planId: string, incluirSinGastos: boolean = false): Promise<any> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    params.append('incluirSinGastos', incluirSinGastos.toString());
    return this.request<any>(`/analisis/categoria/${planId}?${params.toString()}`);
  }

  async analisisTemporal(planId: string, tipoAnalisis: string = "Diario"): Promise<any> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    params.append('tipoAnalisis', tipoAnalisis);
    return this.request<any>(`/analisis/temporal/${planId}?${params.toString()}`);
  }

  async gastosPorActividad(planId: string, incluirSinActividad: boolean = true): Promise<any> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    params.append('incluirSinActividad', incluirSinActividad.toString());
    return this.request<any>(`/analisis/actividad/${planId}?${params.toString()}`);
  }

  async conversionMonedas(planId: string): Promise<any> {
    return this.request<any>(`/analisis/monedas/${planId}`);
  }

  async actualizarCostosActividades(planId: string): Promise<any> {
    return this.request<any>(`/analisis/actualizar-costos-actividades/${planId}`, {
      method: 'POST',
    });
  }
}

export const gastosViajeService = new GastosViajeService();