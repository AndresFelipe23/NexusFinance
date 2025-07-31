import { API_BASE_URL } from '../utils/constants';
import { authService } from './authService';
import type { ActividadViaje } from '../types/actividadViaje';

interface CrearActividadViajeDTO {
  planId: string;
  nombreActividad: string;
  descripcion?: string;
  fechaHoraInicio?: string; // ISO date string
  fechaHoraFin?: string; // ISO date string
  costoEstimado: number;
  ubicacion?: string;
  categoriaViajeId?: string;
  prioridad: string;
  urlReferencia?: string;
}

interface ActualizarActividadViajeDTO {
  actividadId: string;
  nombreActividad?: string;
  descripcion?: string;
  fechaHoraInicio?: string; // ISO date string
  fechaHoraFin?: string; // ISO date string
  costoEstimado?: number;
  costoReal?: number;
  ubicacion?: string;
  categoriaViajeId?: string;
  prioridad?: string;
  estadoActividad?: string;
  urlReferencia?: string;
}

class ActividadesViajeService {
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
    const response = await fetch(`${API_BASE_URL}/ActividadesViaje${endpoint}`,
      {
        headers: await this.getAuthHeaders(),
        ...options,
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la petición');
    }
    return response.json();
  }

  async crearActividad(dto: CrearActividadViajeDTO): Promise<ActividadViaje> {
    return this.request<ActividadViaje>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async actualizarActividad(dto: ActualizarActividadViajeDTO): Promise<ActividadViaje> {
    return this.request<ActividadViaje>(`/${dto.actividadId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarActividad(actividadId: string, eliminacionFisica: boolean = false): Promise<void> {
    return this.request<void>(`/${actividadId}?eliminacionFisica=${eliminacionFisica}`, {
      method: 'DELETE',
    });
  }

  async obtenerActividadPorId(actividadId: string): Promise<ActividadViaje> {
    return this.request<ActividadViaje>(`/${actividadId}`);
  }

  async obtenerActividadesPorPlan(planId: string, estadoActividad?: string, prioridad?: string, categoriaViajeId?: string, fechaDesde?: string, fechaHasta?: string, incluirCanceladas: boolean = false, ordenarPor: string = "Fecha"): Promise<ActividadViaje[]> {
    const params = new URLSearchParams();
    if (estadoActividad) params.append('estadoActividad', estadoActividad);
    if (prioridad) params.append('prioridad', prioridad);
    if (categoriaViajeId) params.append('categoriaViajeId', categoriaViajeId);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    params.append('incluirCanceladas', incluirCanceladas.toString());
    params.append('ordenarPor', ordenarPor);
    return this.request<ActividadViaje[]>(`/plan/${planId}?${params.toString()}`);
  }
}

export const actividadesViajeService = new ActividadesViajeService();