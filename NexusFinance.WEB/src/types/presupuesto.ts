export interface Presupuesto {
  presupuestoId: string;
  usuarioId: string;
  nombrePresupuesto: string;
  periodoPresupuesto: string;
  fechaInicio: string; // DateOnly se convierte a string
  fechaFin?: string; // DateOnly opcional
  presupuestoTotal: number;
  estaActivo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CrearPresupuestoDTO {
  usuarioId: string;
  nombrePresupuesto: string;
  periodoPresupuesto: string;
  fechaInicio: string;
  fechaFin?: string;
  presupuestoTotal: number;
}

export interface ActualizarPresupuestoDTO {
  presupuestoId: string;
  nombrePresupuesto?: string;
  periodoPresupuesto?: string;
  fechaInicio?: string;
  fechaFin?: string;
  presupuestoTotal?: number;
  estaActivo?: boolean;
}

export interface PresupuestoFormData {
  nombrePresupuesto: string;
  periodoPresupuesto: string;
  fechaInicio: string;
  fechaFin?: string;
  presupuestoTotal: number;
}

export interface PresupuestoConCategorias extends Presupuesto {
  categorias?: CategoriaPresupuesto[];
}

export interface CategoriaPresupuesto {
  categoriaPresupuestoId: string;
  presupuestoId: string;
  categoriaId: string;
  nombreCategoria: string;
  montoAsignado: number;
  montoGastado?: number;
  estaActivo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
} 