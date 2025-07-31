export interface DocumentoViaje {
  documentoId: string;
  planId: string;
  tipoDocumento: string;
  nombreDocumento: string;
  numeroDocumento?: string;
  fechaExpedicion?: string; // ISO date string
  fechaVencimiento?: string; // ISO date string
  urlArchivo?: string;
  notas?: string;
  esObligatorio: boolean;
  estaVerificado: boolean;
  fechaCreacion: string; // ISO date string
  fechaActualizacion: string; // ISO date string
}