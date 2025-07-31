export interface PresupuestoViaje {
  presupuestoViajeId: string;
  planId: string;
  categoriaViajeId: string;
  presupuestoEstimado: number;
  gastoReal: number;
  notas?: string;
  fechaCreacion: string; // ISO date string
  fechaActualizacion: string; // ISO date string
}