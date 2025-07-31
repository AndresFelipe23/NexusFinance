import { API_BASE_URL } from '../utils/constants';
import { authService } from './authService';
import type { PresupuestoViaje } from '../types/presupuestoViaje';

interface CrearPresupuestoViajeDTO {
  planId: string;
  categoriaViajeId: string;
  presupuestoEstimado: number;
  notas?: string;
}

interface ActualizarPresupuestoViajeDTO {
  presupuestoViajeId: string;
  presupuestoEstimado?: number;
  gastoReal?: number;
  notas?: string;
  actualizarSoloNotas?: boolean;
}

class PresupuestoViajeService {
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
    const response = await fetch(`${API_BASE_URL}/PresupuestoViaje${endpoint}`,
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

  async crearPresupuesto(dto: CrearPresupuestoViajeDTO): Promise<PresupuestoViaje> {
    return this.request<PresupuestoViaje>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async actualizarPresupuesto(dto: ActualizarPresupuestoViajeDTO): Promise<PresupuestoViaje> {
    return this.request<PresupuestoViaje>(`/${dto.presupuestoViajeId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarPresupuesto(presupuestoViajeId: string): Promise<void> {
    return this.request<void>(`/${presupuestoViajeId}`, {
      method: 'DELETE',
    });
  }

  async obtenerPresupuestoPorId(presupuestoViajeId: string): Promise<PresupuestoViaje> {
    return this.request<PresupuestoViaje>(`/${presupuestoViajeId}`);
  }

  async obtenerPresupuestosPorPlan(planId: string, incluirResumen: boolean = true, ordenarPor: string = "Categoria"): Promise<PresupuestoViaje[]> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    params.append('incluirResumen', incluirResumen.toString());
    params.append('ordenarPor', ordenarPor);
    return this.request<PresupuestoViaje[]>(`/plan/${planId}?${params.toString()}`);
  }

  async crearPresupuestoCompleto(planId: string, presupuestoTotal?: number, soloObligatorias: boolean = true): Promise<any> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    if (presupuestoTotal) params.append('presupuestoTotal', presupuestoTotal.toString());
    params.append('soloObligatorias', soloObligatorias.toString());
    return this.request<any>(`/crear-completo?${params.toString()}`, {
      method: 'POST',
    });
  }

  async actualizarGastosReales(planId?: string, categoriaViajeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (planId) params.append('planId', planId);
    if (categoriaViajeId) params.append('categoriaViajeId', categoriaViajeId);
    return this.request<any>(`/actualizar-gastos-reales?${params.toString()}`, {
      method: 'POST',
    });
  }
}

export const presupuestoViajeService = new PresupuestoViajeService();