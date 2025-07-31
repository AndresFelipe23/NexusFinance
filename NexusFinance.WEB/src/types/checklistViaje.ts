export interface ChecklistViaje {
  checklistId: string;
  planId: string;
  item: string;
  descripcion?: string;
  categoriaChecklist: 'documentos' | 'equipaje' | 'salud' | 'finanzas' | 'general';
  estaCompletado: boolean;
  fechaLimite?: string;
  prioridad: 'alta' | 'media' | 'baja';
  ordenVisualizacion: number;
  fechaCreacion: string;
  fechaCompletado?: string;
}

export interface CreateChecklistViajeDTO {
  planId: string;
  item: string;
  descripcion?: string;
  categoriaChecklist?: 'documentos' | 'equipaje' | 'salud' | 'finanzas' | 'general';
  fechaLimite?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  ordenVisualizacion?: number;
}

export interface UpdateChecklistViajeDTO {
  checklistId: string;
  item?: string;
  descripcion?: string;
  categoriaChecklist?: 'documentos' | 'equipaje' | 'salud' | 'finanzas' | 'general';
  estaCompletado?: boolean;
  fechaLimite?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  ordenVisualizacion?: number;
}

export interface ChecklistStats {
  total: number;
  completados: number;
  pendientes: number;
  porVencer: number;
  vencidos: number;
}

export interface ChecklistPorCategoria {
  categoria: string;
  items: ChecklistViaje[];
  completados: number;
  total: number;
  porcentaje: number;
}