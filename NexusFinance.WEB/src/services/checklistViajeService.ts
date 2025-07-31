import type { 
  ChecklistViaje, 
  CreateChecklistViajeDTO, 
  UpdateChecklistViajeDTO,
  ChecklistStats,
  ChecklistPorCategoria
} from '../types/checklistViaje';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class ChecklistViajeService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('nexus_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private convertFromPascalCase(data: any): ChecklistViaje {
    return {
      checklistId: data.ChecklistId,
      planId: data.PlanId,
      item: data.Item,
      descripcion: data.Descripcion,
      categoriaChecklist: data.CategoriaChecklist,
      estaCompletado: data.EstaCompletado,
      fechaLimite: data.FechaLimite,
      prioridad: data.Prioridad,
      ordenVisualizacion: data.OrdenVisualizacion,
      fechaCreacion: data.FechaCreacion,
      fechaCompletado: data.FechaCompletado
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async obtenerChecklistPorPlan(planId: string): Promise<ChecklistViaje[]> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/plan/${planId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const result = await this.handleResponse<any[]>(response);
    
    // Convertir de PascalCase a camelCase
    const convertedResult = result.map(item => this.convertFromPascalCase(item));
    
    return convertedResult;
  }

  async obtenerChecklistPorId(checklistId: string): Promise<ChecklistViaje> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/${checklistId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const result = await this.handleResponse<any>(response);
    
    // Convertir de PascalCase a camelCase
    return this.convertFromPascalCase(result);
  }

  async crearItemChecklist(dto: CreateChecklistViajeDTO): Promise<ChecklistViaje> {
    // Convertir a formato esperado por el backend
    const backendDto = {
      PlanId: dto.planId,
      Item: dto.item,
      Descripcion: dto.descripcion || null,
      CategoriaChecklist: dto.categoriaChecklist || 'general',
      FechaLimite: dto.fechaLimite || null,
      Prioridad: dto.prioridad || 'media',
      OrdenVisualizacion: dto.ordenVisualizacion || 0
    };

    const response = await fetch(`${API_BASE_URL}/ChecklistViaje`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(backendDto)
    });
    const result = await this.handleResponse<any>(response);
    
    // Convertir de PascalCase a camelCase
    return this.convertFromPascalCase(result);
  }

  async actualizarItemChecklist(dto: UpdateChecklistViajeDTO): Promise<ChecklistViaje> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/${dto.checklistId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(dto)
    });
    const result = await this.handleResponse<any>(response);
    
    // Convertir de PascalCase a camelCase
    return this.convertFromPascalCase(result);
  }

  async eliminarItemChecklist(checklistId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/${checklistId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al eliminar el item del checklist');
    }
  }

  async marcarComoCompletado(checklistId: string, completado: boolean = true): Promise<ChecklistViaje> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/marcar-completado/${checklistId}?estaCompletado=${completado}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const result = await this.handleResponse<any>(response);
    
    // Convertir de PascalCase a camelCase
    return this.convertFromPascalCase(result);
  }

  // Métodos de utilidad y estadísticas
  calcularEstadisticas(items: ChecklistViaje[]): ChecklistStats {
    const total = items.length;
    const completados = items.filter(item => item.estaCompletado).length;
    const pendientes = total - completados;
    
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    
    let porVencer = 0;
    let vencidos = 0;
    
    items.forEach(item => {
      if (!item.estaCompletado && item.fechaLimite) {
        const fechaLimite = new Date(item.fechaLimite);
        if (fechaLimite < hoy) {
          vencidos++;
        } else if (fechaLimite <= en7Dias) {
          porVencer++;
        }
      }
    });

    return {
      total,
      completados,
      pendientes,
      porVencer,
      vencidos
    };
  }

  agruparPorCategoria(items: ChecklistViaje[]): ChecklistPorCategoria[] {
    const categorias = ['documentos', 'equipaje', 'salud', 'finanzas', 'general'] as const;
    
    const resultado = categorias.map(categoria => {
      const itemsCategoria = items.filter(item => item.categoriaChecklist === categoria);
      const completados = itemsCategoria.filter(item => item.estaCompletado).length;
      const total = itemsCategoria.length;
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

      return {
        categoria,
        items: itemsCategoria.sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion),
        completados,
        total,
        porcentaje
      };
    }).filter(cat => cat.total > 0);

    return resultado;
  }

  obtenerIconoCategoria(categoria: string): string {
    const iconos = {
      documentos: '📄',
      equipaje: '🧳',
      salud: '⚕️',
      finanzas: '💰',
      general: '📋'
    };
    return iconos[categoria as keyof typeof iconos] || '📋';
  }

  obtenerColorCategoria(categoria: string): string {
    const colores = {
      documentos: 'from-blue-500 to-blue-600',
      equipaje: 'from-purple-500 to-purple-600',
      salud: 'from-green-500 to-green-600',
      finanzas: 'from-yellow-500 to-yellow-600',
      general: 'from-gray-500 to-gray-600'
    };
    return colores[categoria as keyof typeof colores] || 'from-gray-500 to-gray-600';
  }

  obtenerColorPrioridad(prioridad: string): string {
    const colores = {
      alta: 'text-red-600 bg-red-100 border-red-200',
      media: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      baja: 'text-green-600 bg-green-100 border-green-200'
    };
    return colores[prioridad as keyof typeof colores] || 'text-gray-600 bg-gray-100 border-gray-200';
  }

  obtenerIconoPrioridad(prioridad: string): string {
    const iconos = {
      alta: '🔴',
      media: '🟡',
      baja: '🟢'
    };
    return iconos[prioridad as keyof typeof iconos] || '⚪';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearFechaCorta(fecha: string | Date): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerDiasRestantes(fechaLimite: string): number | null {
    if (!fechaLimite) return null;
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diffTime = limite.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  obtenerEstadoFecha(fechaLimite: string): 'vencido' | 'por-vencer' | 'normal' | 'sin-fecha' {
    if (!fechaLimite) return 'sin-fecha';
    
    const dias = this.obtenerDiasRestantes(fechaLimite);
    if (dias === null) return 'sin-fecha';
    
    if (dias < 0) return 'vencido';
    if (dias <= 3) return 'por-vencer';
    return 'normal';
  }

  // Método para generar checklist básico desde el backend
  async generarChecklistBasico(planId: string, esViajeInternacional: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ChecklistViaje/crear-basico/${planId}?esViajeInternacional=${esViajeInternacional}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al generar checklist básico');
    }
  }

  // Métodos para generar checklists predefinidos (para uso local)
  obtenerChecklistPredefinido(tipoViaje: 'nacional' | 'internacional'): Omit<CreateChecklistViajeDTO, 'planId'>[] {
    const checklistBase: Omit<CreateChecklistViajeDTO, 'planId'>[] = [
      // Documentos
      { item: 'Cédula de ciudadanía', categoriaChecklist: 'documentos', prioridad: 'alta', ordenVisualizacion: 1 },
      { item: 'Reservas de hotel', categoriaChecklist: 'documentos', prioridad: 'alta', ordenVisualizacion: 2 },
      { item: 'Boletos de transporte', categoriaChecklist: 'documentos', prioridad: 'alta', ordenVisualizacion: 3 },
      { item: 'Seguro de viaje', categoriaChecklist: 'documentos', prioridad: 'media', ordenVisualizacion: 4 },
      
      // Equipaje
      { item: 'Ropa para el clima del destino', categoriaChecklist: 'equipaje', prioridad: 'alta', ordenVisualizacion: 10 },
      { item: 'Zapatos cómodos', categoriaChecklist: 'equipaje', prioridad: 'media', ordenVisualizacion: 11 },
      { item: 'Artículos de aseo personal', categoriaChecklist: 'equipaje', prioridad: 'alta', ordenVisualizacion: 12 },
      { item: 'Cargadores de dispositivos', categoriaChecklist: 'equipaje', prioridad: 'media', ordenVisualizacion: 13 },
      
      // Salud
      { item: 'Medicamentos personales', categoriaChecklist: 'salud', prioridad: 'alta', ordenVisualizacion: 20 },
      { item: 'Botiquín básico', categoriaChecklist: 'salud', prioridad: 'media', ordenVisualizacion: 21 },
      
      // Finanzas
      { item: 'Dinero en efectivo local', categoriaChecklist: 'finanzas', prioridad: 'alta', ordenVisualizacion: 30 },
      { item: 'Tarjetas bancarias', categoriaChecklist: 'finanzas', prioridad: 'alta', ordenVisualizacion: 31 },
      { item: 'Informar al banco sobre el viaje', categoriaChecklist: 'finanzas', prioridad: 'media', ordenVisualizacion: 32 },
      
      // General
      { item: 'Revisar el clima del destino', categoriaChecklist: 'general', prioridad: 'media', ordenVisualizacion: 40 },
      { item: 'Confirmar todas las reservas', categoriaChecklist: 'general', prioridad: 'alta', ordenVisualizacion: 41 }
    ];

    if (tipoViaje === 'internacional') {
      checklistBase.unshift(
        { item: 'Pasaporte vigente', categoriaChecklist: 'documentos', prioridad: 'alta', ordenVisualizacion: 0 },
        { item: 'Visa (si es requerida)', categoriaChecklist: 'documentos', prioridad: 'alta', ordenVisualizacion: 1 }
      );
      
      checklistBase.push(
        { item: 'Vacunas requeridas', categoriaChecklist: 'salud', prioridad: 'alta', ordenVisualizacion: 19 },
        { item: 'Cambio de moneda', categoriaChecklist: 'finanzas', prioridad: 'media', ordenVisualizacion: 29 },
        { item: 'Adaptadores de corriente', categoriaChecklist: 'equipaje', prioridad: 'media', ordenVisualizacion: 14 }
      );
    }

    return checklistBase;
  }
}

export const checklistViajeService = new ChecklistViajeService();