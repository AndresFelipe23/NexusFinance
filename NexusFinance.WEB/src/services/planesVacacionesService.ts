import { API_BASE_URL } from '../utils/constants';
import { authService } from './authService';
import type { PlanVacaciones } from '../types/planVacaciones';

interface CrearPlanVacacionesDTO {
  usuarioId: string;
  nombrePlan: string;
  descripcion?: string;
  destino: string;
  pais: string;
  ciudad?: string;
  fechaInicio: string; // ISO date string
  fechaFin: string; // ISO date string
  cantidadPersonas?: number;
  presupuestoEstimado?: number;
  monedaDestino?: string;
  tasaCambio?: number;
  esViajeInternacional?: boolean;
  metaFinancieraId?: string;
}

interface ActualizarPlanVacacionesDTO {
  planId: string;
  nombrePlan?: string;
  descripcion?: string;
  destino?: string;
  pais?: string;
  ciudad?: string;
  fechaInicio?: string; // ISO date string
  fechaFin?: string; // ISO date string
  cantidadPersonas?: number;
  presupuestoEstimado?: number;
  presupuestoReal?: number;
  monedaDestino?: string;
  tasaCambio?: number;
  estadoPlan?: string;
  esViajeInternacional?: boolean;
  metaFinancieraId?: string;
}

class PlanesVacacionesService {
  private convertFromPascalCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertFromPascalCase(item));
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        converted[camelKey] = this.convertFromPascalCase(value);
      }
      return converted;
    }
    return obj;
  }

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
    const response = await fetch(`${API_BASE_URL}/PlanesVacacione${endpoint}`,
      {
        headers: await this.getAuthHeaders(),
        ...options,
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Recurso no encontrado: ${endpoint}`);
      }
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }
    return response.json();
  }

  async crearPlan(dto: CrearPlanVacacionesDTO): Promise<PlanVacaciones> {
    const result = await this.request<PlanVacaciones>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return this.convertFromPascalCase(result);
  }

  async actualizarPlan(dto: ActualizarPlanVacacionesDTO): Promise<PlanVacaciones> {
    const result = await this.request<PlanVacaciones>(`/${dto.planId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return this.convertFromPascalCase(result);
  }

  async eliminarPlan(planId: string, eliminacionFisica: boolean = false): Promise<void> {
    return this.request<void>(`/${planId}?eliminacionFisica=${eliminacionFisica}`, {
      method: 'DELETE',
    });
  }

  async obtenerPlanPorId(planId: string): Promise<PlanVacaciones> {
    const result = await this.request<PlanVacaciones>(`/${planId}`);
    return this.convertFromPascalCase(result);
  }

  async obtenerPlanesPorUsuario(usuarioId: string, estadoPlan?: string, soloActivos: boolean = true, ordenarPor: string = "fecha_inicio"): Promise<PlanVacaciones[]> {
    const params = new URLSearchParams();
    if (estadoPlan) params.append('estadoPlan', estadoPlan);
    params.append('soloActivos', soloActivos.toString());
    params.append('ordenarPor', ordenarPor);
    const result = await this.request<PlanVacaciones[]>(`/usuario/${usuarioId}?${params.toString()}`);
    return this.convertFromPascalCase(result);
  }
}

export const planesVacacionesService = new PlanesVacacionesService();