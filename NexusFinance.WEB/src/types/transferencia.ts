export interface Transferencia {
  transferenciaId: string;
  usuarioId: string;
  cuentaOrigenId: string;
  nombreCuentaOrigen?: string;
  tipoCuentaOrigen?: string;
  bancoCuentaOrigen?: string;
  cuentaDestinoId: string;
  nombreCuentaDestino?: string;
  tipoCuentaDestino?: string;
  bancoCuentaDestino?: string;
  monto: number;
  comisionTransferencia?: number;
  descripcion?: string;
  fechaTransferencia: string;
  fechaCreacion?: string;
  montoTotal?: number;
}

export interface CrearTransferenciaDTO {
  usuarioId: string;
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: number;
  comisionTransferencia?: number;
  descripcion?: string;
  fechaTransferencia: string;
}

export interface ActualizarTransferenciaDTO {
  transferenciaId: string;
  cuentaOrigenId?: string;
  cuentaDestinoId?: string;
  monto?: number;
  comisionTransferencia?: number;
  descripcion?: string;
  fechaTransferencia?: string;
}

export interface EstadisticasTransferencias {
  totalTransferencias: number;
  montoTotalTransferido: number;
  totalComisiones: number;
  montoPromedio: number;
  primeraTransferencia?: string;
  ultimaTransferencia?: string;
} 