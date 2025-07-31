import { authService } from './authService';
import type { 
  Presupuesto, 
  CrearPresupuestoDTO, 
  ActualizarPresupuestoDTO, 
  PresupuestoConCategorias 
} from '../types/presupuesto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class PresupuestoService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Obtener todos los presupuestos del usuario
  async obtenerPresupuestosPorUsuario(
    usuarioId: string, 
    periodo?: string, 
    soloActivos: boolean = true,
    fechaReferencia?: Date
  ): Promise<Presupuesto[]> {
    const params = new URLSearchParams();
    if (periodo) params.append('periodo', periodo);
    params.append('soloActivos', soloActivos.toString());
    // Solo enviar fechaReferencia si se proporciona explícitamente
    // if (fechaReferencia) params.append('fechaReferencia', fechaReferencia.toISOString());

    const response = await fetch(
      `${API_BASE_URL}/Presupuesto/usuario/${usuarioId}?${params.toString()}`,
      {
        headers: await this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener los presupuestos: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Obtener un presupuesto por ID
  async obtenerPresupuestoPorId(
    presupuestoId: string, 
    incluirCategorias: boolean = true
  ): Promise<PresupuestoConCategorias> {
    const response = await fetch(
      `${API_BASE_URL}/Presupuesto/${presupuestoId}?incluirCategorias=${incluirCategorias}`,
      {
        headers: await this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener el presupuesto');
    }

    const data = await response.json();
    return data;
  }

  // Crear un nuevo presupuesto
  async crearPresupuesto(dto: CrearPresupuestoDTO): Promise<Presupuesto> {
    const response = await fetch(`${API_BASE_URL}/Presupuesto`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(dto) // Envía el DTO directamente
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al crear el presupuesto: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Actualizar un presupuesto
  async actualizarPresupuesto(presupuestoId: string, dto: ActualizarPresupuestoDTO): Promise<Presupuesto> {
    const response = await fetch(`${API_BASE_URL}/Presupuesto/${presupuestoId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(dto)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al actualizar el presupuesto: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Eliminar un presupuesto
  async eliminarPresupuesto(presupuestoId: string, eliminacionFisica: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Presupuesto/${presupuestoId}?eliminacionFisica=${eliminacionFisica}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al eliminar el presupuesto: ${response.status} ${response.statusText}`);
    }
  }

  // Desactivar un presupuesto
  async desactivarPresupuesto(presupuestoId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Presupuesto/${presupuestoId}?eliminacionFisica=false`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al desactivar el presupuesto: ${response.status} ${response.statusText}`);
    }
  }

  // Reactivar un presupuesto
  async reactivarPresupuesto(presupuestoId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Presupuesto/${presupuestoId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        presupuestoId: presupuestoId,
        estaActivo: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al reactivar el presupuesto: ${response.status} ${response.statusText}`);
    }
  }

  // Utilidades para períodos de presupuesto
  getPeriodosPresupuesto(): string[] {
    return [
      'Mensual',
      'Trimestral', 
      'Semestral',
      'Anual',
      'Personalizado'
    ];
  }

  // Calcular fecha fin basada en período
  calcularFechaFin(fechaInicio: string, periodo: string): string {
    const inicio = new Date(fechaInicio);
    const fin = new Date(inicio);

    switch (periodo) {
      case 'Mensual':
        fin.setMonth(fin.getMonth() + 1);
        fin.setDate(fin.getDate() - 1); // Último día del mes
        break;
      case 'Trimestral':
        fin.setMonth(fin.getMonth() + 3);
        fin.setDate(fin.getDate() - 1);
        break;
      case 'Semestral':
        fin.setMonth(fin.getMonth() + 6);
        fin.setDate(fin.getDate() - 1);
        break;
      case 'Anual':
        fin.setFullYear(fin.getFullYear() + 1);
        fin.setDate(fin.getDate() - 1);
        break;
      default:
        // Personalizado - no calcular automáticamente
        return '';
    }

    return fin.toISOString().split('T')[0];
  }

  // Formatear período para mostrar
  formatearPeriodo(periodo: string): string {
    const periodos: { [key: string]: string } = {
      'Mensual': 'Mensual',
      'Trimestral': 'Trimestral',
      'Semestral': 'Semestral', 
      'Anual': 'Anual',
      'Personalizado': 'Personalizado'
    };
    return periodos[periodo] || periodo;
  }

  // Formatear fechas para mostrar
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Formatear monto para mostrar
  formatearMonto(monto: number, moneda: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  }

  // Calcular progreso del presupuesto
  calcularProgreso(presupuestoTotal: number, montoGastado: number = 0): number {
    if (presupuestoTotal === 0) return 0;
    return Math.min((montoGastado / presupuestoTotal) * 100, 100);
  }

  // Obtener color del progreso
  getColorProgreso(progreso: number): string {
    if (progreso >= 90) return 'text-red-600 bg-red-100';
    if (progreso >= 75) return 'text-orange-600 bg-orange-100';
    if (progreso >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  }
}

export const presupuestoService = new PresupuestoService(); 