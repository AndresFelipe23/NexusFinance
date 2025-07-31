export interface TransaccionRecurrente {
  recurrenteId: string;
  usuarioId: string;
  cuentaId: string;
  nombreCuenta?: string;
  categoriaId: string;
  nombreCategoria?: string;
  tipoCategoria?: string;
  iconoCategoria?: string;
  color?: string;
  monto: number;
  tipoTransaccion: string;
  descripcion?: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  proximaFechaEjecucion: string;
  diasParaProximaEjecucion?: number;
  estaActivo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  totalTransaccionesGeneradas?: number;
  estadoTransaccion?: string;
}

export interface CrearTransaccionRecurrenteDTO {
  usuarioId: string;
  cuentaId: string;
  categoriaId: string;
  monto: number;
  tipoTransaccion: string;
  descripcion?: string;
  frecuencia: string;
  fechaInicio: string | Date;
  fechaFin?: string | Date;
}

export interface ActualizarTransaccionRecurrenteDTO {
  recurrenteId: string;
  cuentaId?: string;
  categoriaId?: string;
  monto?: number;
  descripcion?: string;
  frecuencia?: string;
  fechaFin?: string | Date;
  estaActivo?: boolean;
  removerFechaFin?: boolean;
}

export interface FiltrosTransaccionRecurrente {
  tipoTransaccion?: string;
  frecuencia?: string;
  soloActivas?: boolean;
  soloPendientes?: boolean;
} 