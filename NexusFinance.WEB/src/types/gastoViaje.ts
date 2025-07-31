export interface GastoViaje {
  gastoViajeId: string;
  planId: string;
  transaccionId?: string;
  categoriaViajeId: string;
  actividadId?: string;
  monto: number;
  monedaGasto: string;
  montoEnMonedaLocal?: number;
  tasaCambioUsada?: number;
  descripcion: string;
  fechaGasto: string; // ISO date string
  ubicacion?: string;
  numeroPersonas: number;
  urlRecibo?: string;
  notas?: string;
  fechaCreacion: string; // ISO date string
}