export interface PlanVacaciones {
  planId: string;
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
  presupuestoReal?: number;
  monedaDestino?: string;
  tasaCambio?: number;
  estadoPlan: string;
  esViajeInternacional?: boolean;
  metaFinancieraId?: string;
  fechaCreacion: string; // ISO date string
  fechaActualizacion: string; // ISO date string
}