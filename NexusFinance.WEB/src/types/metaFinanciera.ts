export interface MetaFinanciera {
  metaId: string;
  usuarioId: string;
  nombreMeta: string;
  descripcion?: string;
  montoObjetivo: number;
  montoActual?: number;
  fechaObjetivo?: string; // DateTime ISO string (ej: "2024-01-15T10:30:00")
  tipoMeta: string;
  cuentaId?: string;
  estaCompletada?: boolean;
  fechaComplecion?: string; // DateTime ISO string
  fechaCreacion?: string; // DateTime ISO string
  fechaActualizacion?: string; // DateTime ISO string
}
