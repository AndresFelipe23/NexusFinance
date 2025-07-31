export interface ActividadViaje {
  actividadId: string;
  planId: string;
  nombreActividad: string;
  descripcion?: string;
  fechaHoraInicio?: string; // ISO date string
  fechaHoraFin?: string; // ISO date string
  costoEstimado: number;
  costoReal: number;
  ubicacion?: string;
  categoriaViajeId?: string;
  prioridad: string;
  estadoActividad: string;
  urlReferencia?: string;
  fechaCreacion: string; // ISO date string
  fechaActualizacion: string; // ISO date string
  nombreCategoria?: string;
}